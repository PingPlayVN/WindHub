import React, { useState } from 'react';
import { Peek } from '@doan-labs/peek';

export default function UserAvatar({
  src = '',
  name = '',
  email = '',
  size = 32,
  className = '',
  expression = 'happy',
  animate = false,
  square = false
}) {
  const [imgError, setImgError] = useState(false);
  const identifier = name || email || 'WindHub Player';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={identifier}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={identifier}
    >
      <Peek
        name={identifier}
        size={size}
        expression={expression}
        animate={animate}
        square={square}
      />
    </div>
  );
}

