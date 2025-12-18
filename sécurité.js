// ========================================
// CONFIGURATION SUPABASE
// ========================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'VOTRE_URL_SUPABASE';
const supabaseKey = 'VOTRE_CLE_PUBLIQUE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// INSCRIPTION (SIGN UP)
// ========================================

async function signUp(email, password, username, prenom, nom) {
  try {
    // 1️⃣ Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username // Métadonnées pour le trigger
        }
      }
    });

    if (authError) throw authError;

    // 2️⃣ Le trigger crée automatiquement le profil dans users
    // Mais on peut aussi le mettre à jour avec plus d'infos
    const { error: updateError } = await supabase
      .from('users')
      .update({
        prenom,
        nom,
        username
      })
      .eq('id', authData.user.id);

    if (updateError) throw updateError;

    console.log('✅ Inscription réussie !', authData);
    return { success: true, user: authData.user };

  } catch (error) {
    console.error('❌ Erreur inscription:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// CONNEXION (SIGN IN)
// ========================================

async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    console.log('✅ Connexion réussie !', data);
    return { success: true, user: data.user };

  } catch (error) {
    console.error('❌ Erreur connexion:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// DÉCONNEXION (SIGN OUT)
// ========================================

async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    console.log('✅ Déconnexion réussie !');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// RÉCUPÉRER L'UTILISATEUR CONNECTÉ
// ========================================

async function getCurrentUser() {
  try {
    // Récupérer l'utilisateur auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    // Récupérer le profil complet
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return { ...user, profile };

  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error.message);
    return null;
  }
}

// ========================================
// VÉRIFIER SI L'UTILISATEUR EST ADMIN
// ========================================

async function isAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data?.role === 'admin';

  } catch (error) {
    console.error('❌ Erreur vérification admin:', error.message);
    return false;
  }
}

// ========================================
// ÉCOUTER LES CHANGEMENTS D'AUTHENTIFICATION
// ========================================

function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔔 Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        const user = await getCurrentUser();
        callback({ event, user });
      } else if (event === 'SIGNED_OUT') {
        callback({ event, user: null });
      }
    }
  );

  // Retourner une fonction pour se désabonner
  return () => subscription.unsubscribe();
}

// ========================================
// RÉINITIALISER LE MOT DE PASSE
// ========================================

async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://votre-site.com/reset-password'
    });

    if (error) throw error;

    console.log('✅ Email de réinitialisation envoyé !');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// METTRE À JOUR LE PROFIL
// ========================================

async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Profil mis à jour !', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// EXEMPLE D'UTILISATION DANS UN COMPOSANT
// ========================================

// Dans votre page d'inscription
async function handleSignUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  const prenom = document.getElementById('prenom').value;
  const nom = document.getElementById('nom').value;

  const result = await signUp(email, password, username, prenom, nom);
  
  if (result.success) {
    alert('Inscription réussie ! Vérifiez votre email.');
    // Rediriger vers la page de connexion ou accueil
  } else {
    alert('Erreur : ' + result.error);
  }
}

// Dans votre page de connexion
async function handleSignIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const result = await signIn(email, password);
  
  if (result.success) {
    alert('Connexion réussie !');
    // Rediriger vers l'accueil
    window.location.href = '/accueil';
  } else {
    alert('Erreur : ' + result.error);
  }
}

// Au chargement de l'application
window.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  
  if (user) {
    console.log('Utilisateur connecté:', user.profile.username);
    // Afficher l'interface utilisateur connecté
  } else {
    console.log('Aucun utilisateur connecté');
    // Afficher page de connexion
  }
});

// ========================================
// EXPORTER LES FONCTIONS
// ========================================

export {
  supabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  isAdmin,
  onAuthStateChange,
  resetPassword,
  updateProfile
};
