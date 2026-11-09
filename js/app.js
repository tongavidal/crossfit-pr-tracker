import { supabase } from './supabase.js';

document.addEventListener("DOMContentLoaded", () => {
    const addRecordBtn = document.getElementById("addRecordBtn");

    addRecordBtn.addEventListener("click", () => {
        alert("Coming soon! Add your first personal record.");
    });

    console.log("PR Tracker initialized successfully 💪");
});

