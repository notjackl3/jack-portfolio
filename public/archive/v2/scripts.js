const themeToggleButton = document.getElementById('theme-toggle-button');
const body = document.body;

// Check localStorage for theme preference on load
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-theme');
} else {
  body.classList.remove('dark-theme');
}

themeToggleButton.addEventListener('click', () => {
  body.classList.toggle('dark-theme');

  // Save user preference to localStorage
  if (body.classList.contains('dark-theme')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});


const mobileNav = document.querySelector(".hamburger");
const navbar = document.querySelector(".menubar");

const toggleNav = () => {
  navbar.classList.toggle("active");
  mobileNav.classList.toggle("hamburger-active");
};
mobileNav.addEventListener("click", () => toggleNav());

// $(document).ready(function() {
//   /* Make the items later animated transparant on page load */
//   $(
//     "#projects-header, #projects-bar, #proj1, #proj2, #proj3, #proj4, #about, #about-text, #about-skills, #support-skills, #certifications, #contact-header, #contact-bar, #contact-text, #contact-form, #social-media"
//   ).css("opacity", 0);

//   $("#projects").waypoint(
//     function() {
//       $("#projects-header").addClass("anim-slide-left");
//       $("#projects-bar")
//         .addClass("anim-slide-left")
//         .css("animation-delay", ".25s");
//     },
//     { offset: "90%" }
//   );

//   $("#proj1").waypoint(
//     function() {
//       $("#proj1")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".5s");
//       $("#proj2")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".7s");
//       $("#proj3")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".9s");
//       $("#proj4")
//         .addClass("anim-reveal")
//         .css("animation-delay", "1.1s");
//     },
//     { offset: "80%" }
//   );

//   $(".about").waypoint(
//     function() {
//       $("#about").addClass("anim-reveal");
//       $("#about-text")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".4s");
//       $("#about-skills")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".8s");
//       $("#support-skills")
//         .addClass("anim-reveal")
//         .css("animation-delay", "1.2s");
//     },
//     { offset: "80%" }
//   );

//   $("#certifications").waypoint(
//     function() {
//       $("#certifications").addClass("anim-reveal");
//     },
//     { offset: "110%" }
//   );

//   $("#contact").waypoint(
//     function() {
//       $("#contact-header").addClass("anim-slide-left");
//       $("#contact-bar")
//         .addClass("anim-slide-left")
//         .css("animation-delay", ".25s");
//       $("#contact-text")
//         .addClass("anim-reveal")
//         .css("animation-delay", ".65s");
//       $("#contact-form")
//         .addClass("anim-pop-in")
//         .css("animation-delay", "1.05s");
//       $("#social-media")
//         .addClass("anim-slide-right")
//         .css("animation-delay", "1.15s");
//     },
//     { offset: "80%" }
//   );
// });

document.querySelectorAll(".read-more").forEach(button => {
  button.addEventListener("click", () => {
    const moreText = button.previousElementSibling;
    if (moreText.style.display === "none") {
      moreText.style.display = "inline";
      button.textContent = "[Read less]";
    } else {
      moreText.style.display = "none";
      button.textContent = "[Read more]";
    }
  });
});

function scrollToCenter(event, id) {
  event.preventDefault();
  const element = document.getElementById(id);

  if (element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = window.pageYOffset + elementRect.top;
    const middleScreenPosition = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
    
    window.scrollTo({
      top: middleScreenPosition,
      behavior: 'smooth'
    });

    element.classList.add('flash-effect');

    element.addEventListener('animationend', () => {
      element.classList.remove('flash-effect');
      element.classList.add('flash-effect-reverse');
    
      // remove reverse class after transition
      element.addEventListener('transitionend', () => {
        element.classList.remove('flash-effect-reverse');
        element.style.backgroundColor = '';
      }, { once: true });
    }, { once: true });
  }
}

function scrollToTop(event, id) {
  event.preventDefault();
  const element = document.getElementById(id);

  if (element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = window.pageYOffset + elementRect.top;
    const middleScreenPosition = absoluteElementTop - 100;
    
    window.scrollTo({
      top: middleScreenPosition,
      behavior: 'smooth'
    });
  }
}


const slider = document.getElementById('slider');
  const track = document.getElementById('track');

  // Duplicate items for infinite scroll
  track.innerHTML += track.innerHTML;

  let scrollAmount = 0;
  const speed = 1; // pixels per frame
  let animationFrame; // keep track of current animation

  function slide() {
    scrollAmount += speed;
    if (scrollAmount >= track.scrollWidth / 2) {
      scrollAmount = 0; // loop back seamlessly
    }
    track.style.transform = `translateX(${-scrollAmount}px)`;
    animationFrame = requestAnimationFrame(slide);
  }

  // Start animation
  slide();

  // Pause on hover
  slider.addEventListener('mouseenter', () => cancelAnimationFrame(animationFrame));
  slider.addEventListener('mouseleave', () => {
    cancelAnimationFrame(animationFrame); // cancel any previous frame before starting new
    slide();
  });