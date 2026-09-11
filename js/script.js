// Global safeguard: Ensure absolutely no video autoplays on load, except for testimonials which are handled by IntersectionObserver
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('video').forEach(vid => {
        if (!vid.classList.contains('testimonial-video')) {
            vid.autoplay = false;
            vid.pause();
        }
    });
});

// Testimonial Videos: center-focused auto-play and scroll-snapping
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.testimonials-slider');
    const track = document.querySelector('.testimonials-slide-track');
    if (!slider || !track) return;

    // Grab the first 4 cards to use as templates for infinite cloning
    let originalCards = Array.from(track.querySelectorAll('.testimonial-card')).slice(0, 4);
    
    // Initialize video behaviors
    function initVideo(card) {
        const video = card.querySelector('.testimonial-video');
        const playBtn = card.querySelector('.testimonial-play-btn');
        if (!video) return;
        
        video.muted = false;
        video.volume = 1;
        video.loop = false; // We need to detect when it ends to auto-scroll
        
        // Hide play button since it autoplays automatically
        if (playBtn) playBtn.style.display = 'none';

        // When the video finishes, smoothly scroll to the next card
        video.addEventListener('ended', () => {
            const nextCard = card.nextElementSibling;
            if (nextCard) {
                const scrollLeft = nextCard.offsetLeft - (slider.clientWidth / 2) + (nextCard.clientWidth / 2);
                slider.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        });
        
        // Add a click listener to toggle mute/play manually
        video.addEventListener('click', () => {
            if (video.muted) {
                video.muted = false;
                video.volume = 1;
            } else {
                if (!video.paused) video.pause();
                else video.play();
            }
        });
    }

    // Initialize all currently existing cards in the DOM
    track.querySelectorAll('.testimonial-card').forEach(initVideo);

    let scrollTimeout;
    
    function updateCenterVideo() {
        const viewportCenterX = window.innerWidth / 2;
        
        let closestCard = null;
        let minDistance = Infinity;

        const currentCards = track.querySelectorAll('.testimonial-card');

        // Find the card closest to the horizontal center of the viewport
        currentCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const distance = Math.abs(viewportCenterX - cardCenterX);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestCard = card;
            }
        });

        // Determine if closest card is "sufficiently centered" horizontally and vertically
        let isSufficientlyCentered = false;
        if (closestCard) {
            const rect = closestCard.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const distanceX = Math.abs(viewportCenterX - cardCenterX);
            
            // Check vertical visibility: ensure the card is largely visible in the viewport
            const isVerticallyVisible = (rect.top < window.innerHeight * 0.8) && (rect.bottom > window.innerHeight * 0.2);
            
            // It must be the dominant card horizontally and well visible vertically
            if (distanceX < (rect.width / 2) && isVerticallyVisible) {
                isSufficientlyCentered = true;
            }
        }

        currentCards.forEach(card => {
            const video = card.querySelector('.testimonial-video');
            if (!video) return;
            
            if (card === closestCard && isSufficientlyCentered) {
                // This is the center card. Play it.
                if (video.paused) {
                    video.play().catch(err => {
                        console.log('Autoplay with sound prevented by browser:', err);
                        // Fallback to muted if strict autoplay policies block sound
                        video.muted = true;
                        video.volume = 0;
                        video.play().catch(e => console.log('Autoplay totally prevented:', e));
                    });
                    card.classList.add('is-playing');
                }
            } else {
                // Not the center card. Immediately pause it.
                if (!video.paused) {
                    video.pause();
                    card.classList.remove('is-playing');
                }
            }
        });
        
        // Infinite cloning logic: if we scroll near the end, append more cards
        if (slider.scrollLeft + slider.clientWidth >= track.scrollWidth - 300) {
            originalCards.forEach(orig => {
                const clone = orig.cloneNode(true);
                clone.classList.remove('is-playing');
                const v = clone.querySelector('.testimonial-video');
                if (v) {
                    v.pause();
                    v.currentTime = 0;
                }
                initVideo(clone);
                track.appendChild(clone);
            });
        }
    }

    function handleScrollDebounced() {
        clearTimeout(scrollTimeout);
        // Small debounce to avoid jank while scrolling, but responsive enough for "immediate" pause
        scrollTimeout = setTimeout(updateCenterVideo, 50); 
    }

    // Auto-scroll logic to automatically advance videos one by one
    let autoScrollInterval;
    const AUTO_SCROLL_DELAY = 3500; // Auto-scroll every 3.5 seconds

    function startAutoScroll() {
        stopAutoScroll();
        autoScrollInterval = setInterval(() => {
            const viewportCenterX = window.innerWidth / 2;
            let closestCard = null;
            let minDistance = Infinity;

            const currentCards = track.querySelectorAll('.testimonial-card');
            currentCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const cardCenterX = rect.left + rect.width / 2;
                const distance = Math.abs(viewportCenterX - cardCenterX);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCard = card;
                }
            });

            if (closestCard) {
                const nextCard = closestCard.nextElementSibling;
                if (nextCard) {
                    const scrollLeft = nextCard.offsetLeft - (slider.clientWidth / 2) + (nextCard.clientWidth / 2);
                    slider.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        }, AUTO_SCROLL_DELAY);
    }

    function stopAutoScroll() {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
    }

    let interactionTimeout;
    
    // Listen to horizontal scroll events on the slider
    slider.addEventListener('scroll', () => {
        handleScrollDebounced();
        // Temporarily pause auto-scroll during manual user interaction
        stopAutoScroll();
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(startAutoScroll, 4000); // Resume auto-scroll after 4s of inactivity
    });

    // Listen to vertical scroll events on the entire window
    window.addEventListener('scroll', handleScrollDebounced);

    // Initial check on load and start auto-scroll
    setTimeout(() => {
        updateCenterVideo();
        startAutoScroll();
    }, 100);
});

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
                }
            }

            // Clear any existing status messages
            const existingSuccess = form.querySelector('.submit-success-msg');
            if (existingSuccess) existingSuccess.remove();
            const existingError = form.querySelector('.submit-error-msg');
            if (existingError) existingError.remove();

            // Sends the WhatsApp notification webhook. Called ONLY after the form
            // submission itself has been saved successfully (see the Sheet .then()
            // below) — never here, and never more than once per submit.
            function triggerWhatsAppWebhook() {
                // Botzup Event Notification Webhook URL & Tokens (Environment Specific)
                // NOTE: there is no local backend on port 3502 — local/dev testing
                // (localhost, 127.0.0.1, or any "stg"/"stage" hostname) uses the
                // confirmed-working staging endpoint instead. Update apiBaseUrl/webhookToken
                // in the "else" branch below once the real production webhook token is issued.
                let apiBaseUrl = 'https://api.botzup.net';
                let webhookToken = 'uxlwquy41gim51g2dpewmpmttywulr'; // Production token — replace once confirmed working

                if (
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('stg') ||
                    window.location.hostname.includes('stage')
                ) {
                    apiBaseUrl = 'https://api.stg.botzup.net';
                    webhookToken = 'e60i48uvv4gu3v3jre2y2mtu59nzk'; // Stage Token — confirmed working
                }

                const botzupWebhookURL = `${apiBaseUrl}/api/ecommerce-webhook/trigger/${webhookToken}`;

                let cleanPhone = dataObj.phone ? dataObj.phone.replace(/[^0-9]/g, '') : '';
                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                if (!cleanPhone) return; // No usable WhatsApp number was submitted — nothing to send

                fetch(botzupWebhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: dataObj.name,
                        email: dataObj.email,
                        phone: cleanPhone,
                        whatsapp_number: cleanPhone,
                        customer: {
                            name: dataObj.name,
                            email: dataObj.email,
                            phone: cleanPhone
                        }
                    })
                })
                    .then(async (res) => {
                        const data = await res.json().catch(() => null);
                        if (!res.ok || !data || data.success !== true) {
                            throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
                        }
                        console.log('Botzup WhatsApp notification sent:', data);
                    })
                    // WhatsApp failures are logged only — they never affect the form's
                    // own success/error UI, per the "handle WhatsApp error separately" requirement.
                    .catch(err => console.error('Botzup Webhook Error (non-blocking):', err.message || err));
            }

            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(dataObj),
                mode: 'no-cors'
            })
                .then(response => {
                    // With no-cors, the response is opaque, so we assume success if no network error occurred
                    const successMsg = document.createElement('p');
                    successMsg.className = 'submit-success-msg';
                    successMsg.style.color = '#0f8863'; // Teal green matching the theme
                    successMsg.style.textAlign = 'center';
                    successMsg.style.marginTop = '15px';
                    successMsg.style.fontWeight = '600';
                    successMsg.style.fontSize = '14px';
                    successMsg.innerText = 'Thank you! Contact us.';

                    submitBtn.parentNode.insertBefore(successMsg, submitBtn.nextSibling);
                    form.reset();

                    // Form submission succeeded — now, and only now, trigger the WhatsApp message.
                    triggerWhatsAppWebhook();

                    // If it is the modal form, close the modal after 2 seconds
                    if (modal && form.id === 'modal-form') {
                        setTimeout(() => {
                            modal.style.display = 'none';
                            successMsg.remove();
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Google Sheet Submission Error!', error.message);
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'submit-error-msg';
                    errorMsg.style.color = '#e11d48'; // Red for errors
                    errorMsg.style.textAlign = 'center';
                    errorMsg.style.marginTop = '15px';
                    errorMsg.style.fontWeight = '600';
                    errorMsg.style.fontSize = '14px';
                    errorMsg.innerText = 'There was an error submitting your information. Please try again.';

                    submitBtn.parentNode.insertBefore(errorMsg, submitBtn.nextSibling);
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
});