import { supabase } from './supabase.js';

document.addEventListener("DOMContentLoaded", () => {
    const addRecordBtn = document.getElementById("addRecordBtn");

    addRecordBtn.addEventListener("click", () => {
        alert("Coming soon! Add your first personal record.");
    });

    console.log("PR Tracker initialized successfully 💪");
});

async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, category')
    .limit(5);

  if (error) {
    console.error('Error conectando con Supabase:', error);
    return;
  }

  console.log('Conexión correcta. Ejercicios:', data);
}

testSupabaseConnection();

