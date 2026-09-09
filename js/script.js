// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');

        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
            });

            // If it wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// Testimonial videos: auto-play the one centered in the slider, pause the rest.
// Thumbnails/posters show until a video becomes centered; only one plays at a time.
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.testimonials-slider');
    const wraps = Array.from(document.querySelectorAll('.testimonial-video-wrap'));
    if (!slider || !wraps.length) return;

    const CHECK_INTERVAL_MS = 150;
    const CENTER_TOLERANCE_RATIO = 0.5; // must be within half a card-width of dead center

    let activeWrap = null;
    let rafId = null;
    let lastCheck = 0;

    function pauseWrap(wrap) {
        const video = wrap.querySelector('video');
        if (!video) return;
        video.pause();
        video.currentTime = 0;
        video.controls = false;
        wrap.classList.remove('is-playing');
    }

    function playWrap(wrap) {
        const video = wrap.querySelector('video');
        if (!video) return;
        video.muted = true;
        video.setAttribute('muted', '');
        video.controls = false;
        wrap.classList.add('is-playing');
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                // Playback was blocked; fall back to showing the thumbnail
                wrap.classList.remove('is-playing');
                if (activeWrap === wrap) activeWrap = null;
            });
        }
    }

    // Finds the testimonial card whose horizontal center is closest to the
    // slider's own center, within a tolerance — this is the "centered" video.
    function findCentered() {
        const sliderRect = slider.getBoundingClientRect();
        const sliderCenter = sliderRect.left + sliderRect.width / 2;

        let best = null;
        let bestDist = Infinity;

        wraps.forEach(wrap => {
            const rect = wrap.getBoundingClientRect();
            if (rect.width === 0 || rect.right < sliderRect.left || rect.left > sliderRect.right) return;
            const cardCenter = rect.left + rect.width / 2;
            const dist = Math.abs(cardCenter - sliderCenter);
            if (dist < bestDist) {
                bestDist = dist;
                best = { wrap, rect };
            }
        });

        if (!best || bestDist > best.rect.width * CENTER_TOLERANCE_RATIO) return null;
        return best.wrap;
    }

    function tick(timestamp) {
        if (timestamp - lastCheck >= CHECK_INTERVAL_MS) {
            lastCheck = timestamp;
            const centered = findCentered();
            if (centered !== activeWrap) {
                if (activeWrap) pauseWrap(activeWrap);
                if (centered) playWrap(centered);
                activeWrap = centered;
            }
        }
        rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (rafId !== null) return;
        lastCheck = 0;
        rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (activeWrap) {
            pauseWrap(activeWrap);
            activeWrap = null;
        }
    }

    // Only run the center-check loop while the section is actually on screen,
    // and pause everything when the browser tab itself is hidden.
    const section = document.getElementById('testimonials');
    if (section && 'IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startLoop();
                } else {
                    stopLoop();
                }
            });
        }, { threshold: 0.1 });
        sectionObserver.observe(section);
    } else {
        startLoop();
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLoop();
        } else if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                startLoop();
            }
        }
    });
});

// CTA Behavior
function handleCTA(action) {
    const modal = document.getElementById('cta-modal');
    switch (action) {
        case 'get_started':
            window.location.href = 'https://botzup.net/auth/register';
            break;
        case 'book_demo':
            if (modal) modal.style.display = 'flex';
            break;
        case 'whatsapp_contact':
            window.open('https://wa.me/15551234567?text=Hi!%20I%20am%20interested%20in%20WhatsApp%20AutoAds.', '_blank');
            break;
        default:
            console.log('Action not defined');
    }
}

// Modal closing logic & Form Submissions to Google Sheets
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cta-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target == modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Google Apps Script Web App URL for Google Sheets integration
    // IMPORTANT: Replace the URL below with YOUR actual Web App URL from Google Apps Script!
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxKx5M-jdnYnsfkBa24b3q4MVz3UMPUKAvbxKtjDRh_gy1kS2B9qGm5xQOo9HMCJ0aN/exec';

    // Helper function for submit handling
    function handleFormSubmit(form, fieldsMapping) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (scriptURL === 'https://script.google.com/u/0/home/projects/15BsdXfLUDwFRT6sUaNiDTzl89KX5ukYjmnGdbkp8lOBexxIG5rT_UUSF/edit' || scriptURL.includes('spreadsheets/d/')) {
                alert("ERROR: You have entered the Google Sheet link instead of the Google Apps Script Web App URL. Please read the Walkthrough instructions to generate the correct URL (it should end in /exec).");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            const dataObj = {};

            for (const [sheetKey, elementId] of Object.entries(fieldsMapping)) {
                const inputElement = document.getElementById(elementId);
                if (inputElement) {
                    if (sheetKey === 'Name') dataObj.name = inputElement.value;
                    else if (sheetKey === 'Email') dataObj.email = inputElement.value;
                    else if (sheetKey === 'WhatsApp_Number') dataObj.phone = inputElement.value;
                    else if (sheetKey === 'Message') dataObj.message = inputElement.value;
                }
            }

            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(dataObj),
                mode: 'no-cors'
            })
                .then(response => {
                    // With no-cors, the response is opaque, so we assume success if no network error occurred
                    let msgDiv = form.querySelector('.success-message');
                    if (!msgDiv) {
                        msgDiv = document.createElement('div');
                        msgDiv.className = 'success-message';
                        msgDiv.style.color = 'green';
                        msgDiv.style.marginTop = '15px';
                        msgDiv.style.fontWeight = 'bold';
                        msgDiv.style.textAlign = 'center';
                        form.appendChild(msgDiv);
                    }
                    msgDiv.textContent = 'thankyou contact us';
                    
                    form.reset();
                    if (modal && form.id === 'modal-form') {
                        setTimeout(() => {
                            modal.style.display = 'none';
                            msgDiv.remove();
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Google Sheet Submission Error!', error.message);
                    alert('There was an error submitting your information. Please try again.');
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Bind Hero Form
    const heroForm = document.getElementById('hero-form');
    if (heroForm) {
        handleFormSubmit(heroForm, {
            'Name': 'name',
            'Email': 'email',
            'WhatsApp_Number': 'phone'
        });
    }

    // Bind Modal Form
    const modalForm = document.getElementById('modal-form');
    if (modalForm) {
        handleFormSubmit(modalForm, {
            'Name': 'modal-name',
            'WhatsApp_Number': 'modal-phone'
        });
    }

    // Bind Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        handleFormSubmit(contactForm, {
            'Name': 'contact-name',
            'Email': 'contact-email',
            'WhatsApp_Number': 'contact-phone',
            'Message': 'contact-message'
        });
    }
});
