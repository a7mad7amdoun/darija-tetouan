/* ---------------------------------------------------------------------------
   SUPABASE CONFIGURATION

   >>> YOU MUST FILL IN THE TWO VALUES BELOW. <<<
   Until you do, the app runs in local-only mode: everything works, progress is
   saved on the device, but nothing syncs between devices. That is a deliberate
   choice — see SUPABASE-SETUP.md, step 4, for exactly where to find them.

   BOTH of these values are PUBLIC and safe to commit. The anon key is designed
   to sit in a browser; Row Level Security is what actually protects the data.

   NEVER put any of these in this file, or anywhere in this repository:
     - the service_role key
     - the database password
     - any JWT secret
   If one of those leaks, it bypasses Row Level Security entirely.
   --------------------------------------------------------------------------- */
window.SUPABASE_CONFIG = {
  url:     'https://umswnonsdfmrwoqlcisa.supabase.co',   /* e.g. 'https://abcdefghijklm.supabase.co' */
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtc3dub25zZGZtcndvcWxjaXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Njk2MTIsImV4cCI6MjEwNDQ0NTYxMn0.5OYiX13RXlS1AL_tR1xSAXOMlJYBF8QSKWa-VR5qQkc'    /* the long 'anon' / 'public' key */
};

/* Pinned so a future release cannot change behaviour without you choosing to. */
window.SUPABASE_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
