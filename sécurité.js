// ========================================
// CONFIGURATION SUPABASE
// ========================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'VOTRE_URL_SUPABASE';
const supabaseKey = 'VOTRE_CLE_PUBLIQUE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// INSCRIPTION (CORRIGÉE - PAS DE TRIGGER)
// ========================================

async function signUp(email, password, username, prenom, nom) {
  try {
    // 1️⃣ Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // 2️⃣ Créer le profil manuellement
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        username,
        prenom,
        nom,
        role: 'client'
      });

    if (profileError) throw profileError;

    console.log('✅ Inscription réussie !', authData);
    return { success: true, user: authData.user };

  } catch (error) {
    console.error('❌ Erreur inscription:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// CONNEXION
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
// DÉCONNEXION
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
// RÉCUPÉRER L'UTILISATEUR CONNECTÉ (CORRIGÉ)
// ========================================

async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return { ...user, profile };

  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error.message);
    return null;
  }
}

// ========================================
// VÉRIFIER SI L'UTILISATEUR EST ADMIN (CORRIGÉ)
// ========================================

async function isAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

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
// METTRE À JOUR LE PROFIL (CORRIGÉ)
// ========================================

async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
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
// EXEMPLE D'UTILISATION
// ========================================

async function handleSignUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  const prenom = document.getElementById('prenom').value;
  const nom = document.getElementById('nom').value;

  const result = await signUp(email, password, username, prenom, nom);
  
  if (result.success) {
    alert('Inscription réussie !');
  } else {
    alert('Erreur : ' + result.error);
  }
}

async function handleSignIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const result = await signIn(email, password);
  
  if (result.success) {
    alert('Connexion réussie !');
    window.location.href = '/accueil';
  } else {
    alert('Erreur : ' + result.error);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  
  if (user) {
    console.log('Utilisateur connecté:', user.profile.username);
  } else {
    console.log('Aucun utilisateur connecté');
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
