-- ========================================
-- SCRIPT SQL COMPLET POUR SUPABASE
-- Projet BAC PRO CIEL
-- ========================================

-- 1️⃣ CRÉATION DE LA TABLE USERS
-- ========================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prenom TEXT,
    nom TEXT,
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    dob DATE,
    photo TEXT,
    banned BOOLEAN DEFAULT false,
    protected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ CRÉATION DE LA TABLE ACTUALITES
-- ========================================
CREATE TABLE actualites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    link TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_uid UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ CRÉATION DE LA TABLE COMMENTS
-- ========================================
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actualite_id UUID REFERENCES actualites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4️⃣ CRÉATION DE LA TABLE ACTUALITE_LIKES
-- ========================================
CREATE TABLE actualite_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actualite_id UUID REFERENCES actualites(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(actualite_id, user_id)
);

-- 5️⃣ CRÉATION DE LA TABLE COMMENT_LIKES
-- ========================================
CREATE TABLE comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 6️⃣ CRÉATION DE LA TABLE MAIN_TEXT_LIKES (pour le texte principal)
-- ========================================
CREATE TABLE main_text_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    page TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, page)
);

-- 7️⃣ CRÉATION DE LA TABLE REPLIES (pour les réponses aux commentaires)
-- ========================================
CREATE TABLE replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8️⃣ CRÉATION DE LA TABLE REPLY_LIKES
-- ========================================
CREATE TABLE reply_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_id UUID REFERENCES replies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- ========================================
-- ACTIVATION DE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE actualites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE actualite_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_text_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES POUR LA TABLE USERS
-- ========================================

-- Lecture : tous peuvent lire les utilisateurs non bannis
CREATE POLICY "Lecture publique des utilisateurs"
ON users FOR SELECT
USING (banned = false);

-- Création : tout le monde peut créer un compte
CREATE POLICY "Inscription publique"
ON users FOR INSERT
WITH CHECK (true);

-- Modification : uniquement son propre profil ou admin
CREATE POLICY "Modification de son profil"
ON users FOR UPDATE
USING (id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Suppression : seulement les admins (sauf comptes protégés)
CREATE POLICY "Suppression admin seulement"
ON users FOR DELETE
USING (protected = false AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ========================================
-- POLICIES POUR LA TABLE ACTUALITES
-- ========================================

-- Lecture : tout le monde peut lire les actualités
CREATE POLICY "Lecture publique des actualités"
ON actualites FOR SELECT
USING (true);

-- Création : seulement les admins
CREATE POLICY "Création par admin uniquement"
ON actualites FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Modification : seulement l'admin qui a créé l'actualité
CREATE POLICY "Modification par l'auteur admin"
ON actualites FOR UPDATE
USING (admin_uid = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Suppression : seulement l'admin qui a créé l'actualité
CREATE POLICY "Suppression par l'auteur admin"
ON actualites FOR DELETE
USING (admin_uid = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ========================================
-- POLICIES POUR LA TABLE COMMENTS
-- ========================================

-- Lecture : tout le monde peut lire les commentaires non masqués
CREATE POLICY "Lecture publique des commentaires"
ON comments FOR SELECT
USING (hidden = false OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Création : utilisateurs connectés peuvent commenter
CREATE POLICY "Création de commentaires"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Modification : seulement l'auteur ou admin
CREATE POLICY "Modification commentaire"
ON comments FOR UPDATE
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Suppression : seulement l'auteur ou admin
CREATE POLICY "Suppression commentaire"
ON comments FOR DELETE
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ========================================
-- POLICIES POUR LA TABLE ACTUALITE_LIKES
-- ========================================

-- Lecture : tout le monde peut voir les likes
CREATE POLICY "Lecture publique likes actualités"
ON actualite_likes FOR SELECT
USING (true);

-- Création : utilisateur connecté peut liker
CREATE POLICY "Créer un like sur actualité"
ON actualite_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Suppression : seulement son propre like
CREATE POLICY "Supprimer son like sur actualité"
ON actualite_likes FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- POLICIES POUR LA TABLE COMMENT_LIKES
-- ========================================

-- Lecture : tout le monde peut voir les likes
CREATE POLICY "Lecture publique likes commentaires"
ON comment_likes FOR SELECT
USING (true);

-- Création : utilisateur connecté peut liker
CREATE POLICY "Créer un like sur commentaire"
ON comment_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Suppression : seulement son propre like
CREATE POLICY "Supprimer son like sur commentaire"
ON comment_likes FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- POLICIES POUR LA TABLE MAIN_TEXT_LIKES
-- ========================================

-- Lecture : tout le monde
CREATE POLICY "Lecture publique likes texte principal"
ON main_text_likes FOR SELECT
USING (true);

-- Création : utilisateur connecté
CREATE POLICY "Créer un like sur texte principal"
ON main_text_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Suppression : son propre like
CREATE POLICY "Supprimer son like sur texte principal"
ON main_text_likes FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- POLICIES POUR LA TABLE REPLIES
-- ========================================

-- Lecture : tout le monde
CREATE POLICY "Lecture publique des réponses"
ON replies FOR SELECT
USING (true);

-- Création : utilisateur connecté
CREATE POLICY "Créer une réponse"
ON replies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Modification : auteur ou admin
CREATE POLICY "Modifier sa réponse"
ON replies FOR UPDATE
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Suppression : auteur ou admin
CREATE POLICY "Supprimer sa réponse"
ON replies FOR DELETE
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ========================================
-- POLICIES POUR LA TABLE REPLY_LIKES
-- ========================================

-- Lecture : tout le monde
CREATE POLICY "Lecture publique likes réponses"
ON reply_likes FOR SELECT
USING (true);

-- Création : utilisateur connecté
CREATE POLICY "Créer un like sur réponse"
ON reply_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Suppression : son propre like
CREATE POLICY "Supprimer son like sur réponse"
ON reply_likes FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- CRÉATION DU SUPER ADMIN PAR DÉFAUT
-- ========================================

INSERT INTO users (username, password, prenom, nom, role, protected, banned)
VALUES ('SUPERADMIN', 'MASTER', 'Super', 'Admin', 'admin', true, false)
ON CONFLICT (username) DO NOTHING;

-- ========================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ========================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_actualites_created_at ON actualites(created_at DESC);
CREATE INDEX idx_comments_actualite_id ON comments(actualite_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_actualite_likes_actualite_id ON actualite_likes(actualite_id);
CREATE INDEX idx_actualite_likes_user_id ON actualite_likes(user_id);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_replies_comment_id ON replies(comment_id);

-- ========================================
-- FIN DU SCRIPT
-- ========================================
