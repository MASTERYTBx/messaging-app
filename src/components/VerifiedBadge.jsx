import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { ADMIN_EMAIL } from '../firebase';

export default function VerifiedBadge({ email, size = 16 }) {
  if (email !== ADMIN_EMAIL) return null;
  
  return (
    <BadgeCheck 
      size={size} 
      fill="#1d9bf0" 
      color="white" 
      style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}
      title="Official Admin"
    />
  );
}
