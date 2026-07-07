// ============================================
// NAVIGATION & HAMBURGER MENU
// ============================================

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navLink = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

navLink.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ============================================
// SMOOTH SCROLL FOR NAVIGATION
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// NAVBAR BACKGROUND ON SCROLL
// ============================================

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// ============================================
// AI PHOTO BACKGROUND ANIMATION
// ============================================

(function initAiHeroBackground() {
    const canvas = document.getElementById('aiHeroCanvas');

    if (!canvas || !canvas.getContext) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const portrait = new Image();
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!ctx || !sampleCtx) {
        return;
    }

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let nodes = [];
    let frameId = 0;
    let resizeFrameId = 0;
    let imageReady = false;

    function getCoverCrop(image, targetWidth, targetHeight) {
        const imageWidth = image.naturalWidth || image.width;
        const imageHeight = image.naturalHeight || image.height;
        const imageRatio = imageWidth / imageHeight;
        const targetRatio = targetWidth / targetHeight;
        let sx = 0;
        let sy = 0;
        let sw = imageWidth;
        let sh = imageHeight;

        if (imageRatio > targetRatio) {
            sw = imageHeight * targetRatio;
            sx = Math.max(0, Math.min(imageWidth - sw, (imageWidth - sw) * 0.5));
        } else {
            sh = imageWidth / targetRatio;
            sy = Math.max(0, Math.min(imageHeight - sh, (imageHeight - sh) * 0.1));
        }

        return { sx, sy, sw, sh };
    }

    function drawCoverImage(targetCtx, image, targetWidth, targetHeight, alpha = 1) {
        const crop = getCoverCrop(image, targetWidth, targetHeight);

        targetCtx.save();
        targetCtx.globalAlpha = alpha;
        targetCtx.drawImage(
            image,
            crop.sx,
            crop.sy,
            crop.sw,
            crop.sh,
            0,
            0,
            targetWidth,
            targetHeight
        );
        targetCtx.restore();
    }

    function buildNodes() {
        if (!imageReady || !width || !height) {
            return;
        }

        sampleCanvas.width = Math.max(1, Math.floor(width));
        sampleCanvas.height = Math.max(1, Math.floor(height));
        sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
        drawCoverImage(sampleCtx, portrait, sampleCanvas.width, sampleCanvas.height);

        let pixels;

        try {
            pixels = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
        } catch (error) {
            nodes = [];
            return;
        }

        const step = width < 640 ? 34 : width > 1500 ? 34 : 28;
        const textFadePoint = width < 768 ? 0.5 : 0.42;
        const nextNodes = [];

        for (let y = step * 0.5; y < sampleCanvas.height; y += step) {
            for (let x = step * 0.5; x < sampleCanvas.width; x += step) {
                const pixelIndex = (Math.floor(y) * sampleCanvas.width + Math.floor(x)) * 4;
                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                const textSide = x < sampleCanvas.width * textFadePoint;
                const density = Math.min(0.9, 0.2 + luminance * 0.76) * (textSide ? 0.42 : 1);

                if (luminance < 0.07 && Math.random() > 0.22) {
                    continue;
                }

                if (Math.random() > density) {
                    continue;
                }

                nextNodes.push({
                    x,
                    y,
                    r,
                    g,
                    b,
                    luminance,
                    drift: 4 + Math.random() * 8,
                    phase: Math.random() * Math.PI * 2,
                    size: Math.max(1.2, step * (0.05 + luminance * 0.08))
                });
            }
        }

        nodes = nextNodes;
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(rect.width));
        const nextHeight = Math.max(1, Math.round(rect.height));
        const sizeChanged = nextWidth !== width || nextHeight !== height;

        if (sizeChanged) {
            width = nextWidth;
            height = nextHeight;
            pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }

        if (sizeChanged || nodes.length === 0) {
            buildNodes();
        }
    }

    function drawFrame(time = 0) {
        if (!width || !height) {
            return;
        }

        const seconds = time * 0.001;
        const gradient = ctx.createLinearGradient(0, 0, width, height);

        ctx.clearRect(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
        gradient.addColorStop(0.5, 'rgba(49, 46, 129, 0.28)');
        gradient.addColorStop(1, 'rgba(8, 47, 73, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        if (imageReady) {
            ctx.save();
            ctx.filter = 'blur(18px) saturate(1.22) contrast(1.06)';
            ctx.translate(
                -width * 0.04 + Math.sin(seconds * 0.18) * 16,
                -height * 0.06 + Math.cos(seconds * 0.16) * 12
            );
            drawCoverImage(ctx, portrait, width * 1.1, height * 1.14, 0.24);
            ctx.restore();
        }

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        nodes.forEach((node, index) => {
            const textSide = node.x < width * (width < 768 ? 0.5 : 0.42);
            const wave = Math.sin(seconds * (0.58 + node.luminance * 0.7) + node.phase);
            const pulse = 0.58 + Math.sin(seconds * 1.55 + node.phase) * 0.22;
            const x = node.x + Math.sin(seconds * 0.34 + node.phase) * node.drift;
            const y = node.y + wave * node.drift * 0.72;
            const alpha = (0.08 + node.luminance * 0.46) * pulse * (textSide ? 0.5 : 1);
            const size = node.size * (1 + pulse * 0.32);

            ctx.fillStyle = `rgba(${node.r}, ${node.g}, ${node.b}, ${alpha})`;
            ctx.fillRect(x, y, size * 2.7, Math.max(1, size * 0.42));

            if (index % 17 === 0) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(34, 211, 238, ${alpha * 0.28})`;
                ctx.lineWidth = 1;
                ctx.moveTo(x, y);
                ctx.lineTo(x + 34 + wave * 10, y + Math.cos(seconds + node.phase) * 12);
                ctx.stroke();
            }
        });

        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.42)';
        ctx.lineWidth = 1;

        const lineGap = 78;
        const offset = (seconds * 42) % lineGap;

        for (let y = offset; y < height; y += lineGap) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    function stopAnimation() {
        if (frameId) {
            window.cancelAnimationFrame(frameId);
            frameId = 0;
        }
    }

    function animate(time) {
        drawFrame(time);
        frameId = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!imageReady) {
            return;
        }

        resizeCanvas();
        stopAnimation();

        if (reducedMotionQuery.matches) {
            drawFrame(0);
            return;
        }

        frameId = window.requestAnimationFrame(animate);
    }

    function scheduleResize() {
        if (resizeFrameId) {
            window.cancelAnimationFrame(resizeFrameId);
        }

        resizeFrameId = window.requestAnimationFrame(() => {
            resizeCanvas();

            if (reducedMotionQuery.matches) {
                drawFrame(0);
            }
        });
    }

    portrait.addEventListener('load', () => {
        imageReady = true;
        startAnimation();
    });

    portrait.addEventListener('error', () => {
        canvas.style.display = 'none';
    });

    window.addEventListener('resize', scheduleResize, { passive: true });

    if (reducedMotionQuery.addEventListener) {
        reducedMotionQuery.addEventListener('change', startAnimation);
    } else {
        reducedMotionQuery.addListener(startAnimation);
    }

    portrait.decoding = 'async';
    portrait.src = 'profile.png';
})();

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideInLeft 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe skill and service cards
document.querySelectorAll('.skill-card, .service-card, .project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.animation = 'none';
    observer.observe(card);
});

// ============================================
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form values
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const subject = contactForm.querySelector('input[placeholder="Subject"]').value;
        const message = contactForm.querySelector('textarea').value;

        // Simple validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Here you would normally send the form data to a server
        // For now, we'll just show a success message
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');

        // Reset form
        contactForm.reset();
    });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// ACTIVE NAV LINK HIGHLIGHT
// ============================================

window.addEventListener('scroll', () => {
    let current = '';

    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = 'var(--primary-color)';
        } else {
            link.style.color = 'var(--text-secondary)';
        }
    });
});

// ============================================
// COUNTER ANIMATION FOR STATS
// ============================================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const numbers = entry.target.querySelectorAll('.stat h3');
            numbers.forEach(num => {
                const target = parseInt(num.textContent);
                animateCounter(num, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.about-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// ============================================
// PAGE LOAD ANIMATION
// ============================================

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Set initial opacity
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease-out';

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================

const revealElements = document.querySelectorAll('.about-text');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    revealObserver.observe(el);
});

// ============================================
// MOBILE MENU CLOSE ON LINK CLICK
// ============================================

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
});

// ============================================
// WINDOW RESIZE HANDLER
// ============================================

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// ============================================
// ABOUT PHOTO PARALLAX
// ============================================

const aboutVisual = document.querySelector('.about-photo-wrap');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (aboutVisual && !reduceMotion) {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (ticking) {
            return;
        }

        window.requestAnimationFrame(() => {
            const scrollPosition = window.pageYOffset;
            const offset = Math.min(scrollPosition * 0.08, 28);
            aboutVisual.style.transform = window.innerWidth > 768 ? `translate3d(0, ${offset}px, 0)` : 'none';
            ticking = false;
        });

        ticking = true;
    });
}

// ============================================
// PRELOAD ANIMATIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Fade in elements on page load
    const fadeElements = document.querySelectorAll('.hero-content');
    fadeElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.animation = `heroCopyIn 0.8s ease-out ${index * 0.2}s forwards`;
    });
});

console.log('Portfolio website loaded successfully! 🚀');
