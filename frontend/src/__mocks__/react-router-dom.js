import React from 'react';

export const Link = ({ children, to, ...rest }) => (
  <a href={to} {...rest}>
    {children}
  </a>
);








