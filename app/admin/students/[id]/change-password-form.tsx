'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import { changeStudentPasswordAction } from '../actions';

interface Props {
  userId: string;
}

export function ChangePasswordForm({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await changeStudentPasswordAction(userId, password);
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPassword('');
      setTimeout(() => setOpen(false), 2000);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" icon={<Key className="w-4 h-4" />} onClick={() => setOpen(true)}>
        Change Password
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] animate-scale-in">
      <h4 className="text-sm font-semibold mb-3">Change Password</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="New password (min 6 chars)" 
          required 
          minLength={6}
        />
        
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" loading={loading} size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
