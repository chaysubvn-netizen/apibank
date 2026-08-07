'use client';

import { useEffect, useState } from 'react';

const allowedTags = new Set([
  'A',
  'B',
  'BR',
  'DIV',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'SPAN',
  'STRONG',
  'U',
  'UL',
]);
const allowedStyles = new Set([
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'text-align',
  'text-decoration',
]);

function sanitizeHtml(value: string) {
  const documentValue = new DOMParser().parseFromString(value, 'text/html');
  documentValue
    .querySelectorAll(
      'script,style,iframe,object,embed,form,input,button,meta,link,base'
    )
    .forEach((node) => node.remove());
  [...documentValue.body.querySelectorAll('*')].forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (
        name.startsWith('on') ||
        !['href', 'target', 'rel', 'style', 'class'].includes(name)
      )
        element.removeAttribute(attribute.name);
    });
    if (element instanceof HTMLAnchorElement) {
      const href = element.getAttribute('href')?.trim() || '';
      if (href && !/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href))
        element.removeAttribute('href');
      if (element.target === '_blank') element.rel = 'noopener noreferrer';
    }
    const style = element.getAttribute('style');
    if (style) {
      const safeStyle = style
        .split(';')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) =>
          allowedStyles.has(rule.split(':', 1)[0]?.trim().toLowerCase())
        )
        .join('; ');
      safeStyle
        ? element.setAttribute('style', safeStyle)
        : element.removeAttribute('style');
    }
  });
  return documentValue.body.innerHTML;
}

export default function SafeHtml({
  html,
  className = '',
}: {
  html?: string | null;
  className?: string;
}) {
  const [safe, setSafe] = useState('');
  useEffect(() => setSafe(sanitizeHtml(String(html || ''))), [html]);
  return (
    <div
      className={`safe-rich-html ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
