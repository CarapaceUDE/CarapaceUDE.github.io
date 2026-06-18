import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { A11y, Autoplay, EffectCreative, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-creative';
import './home-carousel.css';
import { slides } from './deck-slides.generated.js';

function HomeCarousel() {
  const swiperRef = useRef(null);
  const autoplayResumeTimer = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => () => window.clearTimeout(autoplayResumeTimer.current), []);

  const stopAutoplay = (swiper) => {
    window.clearTimeout(autoplayResumeTimer.current);
    swiper?.autoplay?.stop();
  };

  const resumeAutoplayAfterIdle = (swiper) => {
    stopAutoplay(swiper);
    autoplayResumeTimer.current = window.setTimeout(() => {
      if (!swiper?.destroyed) swiper.autoplay?.start();
    }, 1800);
  };

  const move = (direction) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    direction === 'next' ? swiper.slideNext() : swiper.slidePrev();
    resumeAutoplayAfterIdle(swiper);
  };

  const goTo = (index) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.slideToLoop(index);
    resumeAutoplayAfterIdle(swiper);
  };

  return (
    <div className="home-carousel-react" aria-roledescription="carousel" aria-label="Carapace and Cortex pitch highlights">
      <div className="home-carousel-stage">
        <Swiper
          modules={[A11y, Autoplay, EffectCreative, Keyboard]}
          effect="creative"
          centeredSlides
          loop
          loopAdditionalSlides={3}
          loopPreventsSliding={false}
          grabCursor
          preventClicks={false}
          preventClicksPropagation={false}
          slidesPerView={1}
          speed={1050}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{ enabled: true }}
          autoplay={{
            delay: 6500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            waitForTransition: true
          }}
          creativeEffect={{
            limitProgress: 1,
            perspective: true,
            prev: {
              translate: ['-72%', 0, -125],
              rotate: [0, -11, 0],
              scale: 0.94,
              opacity: 0.62
            },
            next: {
              translate: ['72%', 0, -125],
              rotate: [0, 11, 0],
              scale: 0.94,
              opacity: 0.62
            }
          }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onRealIndexChange={(swiper) => setActiveIndex(swiper.realIndex)}
          onTouchStart={(swiper) => stopAutoplay(swiper)}
          onTouchEnd={(swiper) => resumeAutoplayAfterIdle(swiper)}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.image}>
              <a
                className="home-carousel-card"
                href={`ideas/?explain=1#slide-${slide.number}`}
                aria-label={`Open slide ${slide.number}, ${slide.title}, with explanation`}
              >
                <img src={slide.image} alt={slide.title} />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        <button className="home-carousel-arrow home-carousel-prev" type="button" aria-label="Previous slide" onClick={() => move('previous')}>
          <span aria-hidden="true">&#8592;</span>
        </button>
        <button className="home-carousel-arrow home-carousel-next" type="button" aria-label="Next slide" onClick={() => move('next')}>
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>

      <div className="home-carousel-pagination" aria-label="Choose a slide">
        <div className="home-carousel-dots">
          {slides.map((slide, index) => (
            <button
              className={`home-carousel-dot${index === activeIndex ? ' is-active' : ''}`}
              type="button"
              aria-label={`Show slide ${slide.number}: ${slide.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => goTo(index)}
              key={slide.number}
            />
          ))}
        </div>
        <div className="home-carousel-count" aria-live="polite">
          {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('home-carousel-root');
if (root) createRoot(root).render(<HomeCarousel />);
