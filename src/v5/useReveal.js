import { useEffect, useRef } from 'react';

// Adds `.is-in` to every `.reveal` inside the returned ref once it scrolls
// into view. One observer per mount; elements are unobserved after revealing
// so nothing re-animates on the way back up.
export function useReveal(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const collect = () => Array.from(root.querySelectorAll('.reveal:not(.is-in)'));

    if (typeof IntersectionObserver === 'undefined') {
      collect().forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    const observeAll = () => collect().forEach((el) => io.observe(el));
    observeAll();

    // Pick up `.reveal` nodes added after mount (HMR, lazily rendered rows),
    // so nothing can get stranded at opacity 0.
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export default useReveal;
