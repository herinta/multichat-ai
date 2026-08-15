import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      const t = setTimeout(() => {
        setDisplayedText('');
        setIsTyping(false);
      }, 0);
      return () => clearTimeout(t);
    }

    let i = 0;
    let timer: ReturnType<typeof setInterval>;
    
    const initTimer = setTimeout(() => {
      setDisplayedText('');
      setIsTyping(true);
      
      timer = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, speed);
    }, 0);

    return () => {
      clearTimeout(initTimer);
      if (timer) clearInterval(timer);
    };
  }, [text, speed]);

  return { displayedText, isTyping };
}
