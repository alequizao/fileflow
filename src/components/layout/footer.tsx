import React from 'react';

export function Footer() {
  return (
    <footer className="text-center text-xs text-muted-foreground py-4 mt-auto border-t">
      FileFlow &copy; {new Date().getFullYear()}
    </footer>
  );
}
