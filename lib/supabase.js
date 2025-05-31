const { createClient } = require('@supabase/supabase-js');

// Ganti dengan milikmu sendiri
const supabaseUrl = 'https://lycufxceveakxsvbydpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3VmeGNldmVha3hzdmJ5ZHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDc4NDEsImV4cCI6MjA2NDEyMzg0MX0.iPktY9hxvSkd0qF8SbU-Z1EJuQzyZw8hmrASjZWteGE';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
