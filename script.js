document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. CLINIC OPERATING HOURS CHECKER (REALTIME)
       ========================================== */
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusDetail = document.getElementById('statusDetail');

    function updateClinicStatus() {
        if (!statusDot || !statusText || !statusDetail) return;

        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 1-6 = Mon-Sat
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Convert current time to minutes from midnight for bulletproof interval matching
        const currentMins = hour * 60 + minute;
        
        // Session times in minutes
        // Morning: 09:00 AM (540 mins) to 02:00 PM (840 mins)
        const morningStart = 540;
        const morningEnd = 840;
        
        // Evening: 06:00 PM (1080 mins) to 08:30 PM (1230 mins)
        const eveningStart = 1080;
        const eveningEnd = 1230;

        const isMorningOPD = currentMins >= morningStart && currentMins < morningEnd;
        const isEveningOPD = currentMins >= eveningStart && currentMins < eveningEnd;

        // Reset classes
        statusDot.className = 'status-dot';
        statusText.className = 'status-text';

        if (day === 0) {
            // Sunday
            statusDot.classList.add('closed');
            statusText.classList.add('closed');
            statusText.textContent = "Closed";
            statusDetail.innerHTML = "Closed today (Sunday). Routine OPD resumes Monday at 09:00 AM.<br><strong style='color:#ef4444;'>Maternity Emergency Helpline is active 24/7.</strong>";
        } else {
            // Monday - Saturday
            if (isMorningOPD || isEveningOPD) {
                statusDot.classList.add('open');
                statusText.classList.add('open');
                statusText.textContent = "Open Now";
                if (isMorningOPD) {
                    statusDetail.textContent = `Consultations active (Morning Session: 09:00 AM - 02:00 PM). Walk-ins and bookings welcome.`;
                } else {
                    statusDetail.textContent = `Consultations active (Evening Session: 06:00 PM - 08:30 PM). Walk-ins welcome.`;
                }
            } else {
                statusDot.classList.add('closed');
                statusText.classList.add('closed');
                statusText.textContent = "Closed";

                if (currentMins < morningStart) {
                    statusDetail.textContent = `Closed. OPD starts today at 09:00 AM.`;
                } else if (currentMins >= morningEnd && currentMins < eveningStart) {
                    statusDetail.textContent = `On afternoon recess. Evening OPD opens today at 06:00 PM.`;
                } else {
                    // After evening session
                    const nextOPDDay = (day === 6) ? "Monday" : "tomorrow";
                    statusDetail.textContent = `Closed for today. OPD resumes ${nextOPDDay} at 09:00 AM.`;
                }
            }
        }
    }

    // Run status update immediately, then every 30 seconds
    updateClinicStatus();
    setInterval(updateClinicStatus, 30000);


    /* ==========================================
       2. MOBILE DRAWER NAVIGATION MENU
       ========================================== */
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('mobile-open');
            // Toggle hamburger animation
            menuToggle.classList.toggle('active');
            
            // Stylized transformation of three bars
            const bars = menuToggle.querySelectorAll('.bar');
            if (menuToggle.classList.contains('active')) {
                bars[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Close menu drawer on clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('mobile-open')) {
                navMenu.classList.remove('mobile-open');
                menuToggle.classList.remove('active');
                const bars = menuToggle.querySelectorAll('.bar');
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
            
            // Set active link visually
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Active link highlighting on scroll
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 180; // Add navbar height offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });


    /* ==========================================
       3. INTERACTIVE APPOINTMENT SCHEDULER
       ========================================== */
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const bookingStatusContainer = document.getElementById('bookingStatusContainer');
    const noBookingState = document.getElementById('noBookingState');
    const ticketBody = document.getElementById('ticketBody');
    const cancelBookingBtn = document.getElementById('cancelBookingBtn');

    // Prevent selecting dates in the past
    if (appointmentDateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        appointmentDateInput.setAttribute('min', todayStr);
    }

    // Helper to generate reference ID
    function generateBookingRef() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let ref = 'BH-';
        for (let i = 0; i < 5; i++) {
            ref += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return ref;
    }

    // Render Ticket Pass Layout
    function renderTicket(bookingData) {
        if (!ticketBody) return;
        
        // Format Date nicely
        const dateObj = new Date(bookingData.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        ticketBody.innerHTML = `
            <div class="ticket-row">
                <span class="label">Pass Reference:</span>
                <span class="value" style="color: var(--primary-dark); font-family: monospace; font-size: 1.1rem;">${bookingData.refId}</span>
            </div>
            <div class="ticket-row">
                <span class="label">Patient Name:</span>
                <span class="value">${bookingData.name}</span>
            </div>
            <div class="ticket-row">
                <span class="label">Mobile Number:</span>
                <span class="value">${bookingData.phone}</span>
            </div>
            <div class="ticket-row">
                <span class="label">Specialty:</span>
                <span class="value">${bookingData.service}</span>
            </div>
            <div class="ticket-row">
                <span class="label">Appt Date:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="ticket-row">
                <span class="label">Time Session:</span>
                <span class="value">${bookingData.session}</span>
            </div>
            <div class="ticket-barcode"></div>
            <p style="font-size: 0.8rem; color: #64748b; text-align: center; margin-top: 12px; line-height: 1.4;">
                * Please bring this pass and report at the reception counter 10 minutes prior to your session timing.
            </p>
        `;
    }

    // Load booking if exists on device
    function loadSavedBooking() {
        const savedBooking = localStorage.getItem('hospital_booking');
        if (savedBooking) {
            const bookingData = JSON.parse(savedBooking);
            renderTicket(bookingData);
            if (noBookingState) noBookingState.classList.add('hidden');
            if (bookingStatusContainer) bookingStatusContainer.classList.remove('hidden');
        } else {
            if (noBookingState) noBookingState.classList.remove('hidden');
            if (bookingStatusContainer) bookingStatusContainer.classList.add('hidden');
        }
    }

    loadSavedBooking();

    // Submit Action
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('patientName').value.trim();
            const phone = document.getElementById('phoneNumber').value.trim();
            const service = document.getElementById('serviceCategory').value;
            const date = document.getElementById('appointmentDate').value;
            const session = document.getElementById('appointmentSession').value;
            const note = document.getElementById('medicalDetails').value.trim();

            // Additional check: Block Sunday booking
            const selectedDay = new Date(date).getDay();
            if (selectedDay === 0) {
                alert("Routine OPD is closed on Sundays. Please choose a date from Monday to Saturday.");
                return;
            }

            const bookingData = {
                name,
                phone,
                service,
                date,
                session,
                note,
                refId: generateBookingRef()
            };

            // Save to localStorage
            localStorage.setItem('hospital_booking', JSON.stringify(bookingData));
            
            // Render UI
            renderTicket(bookingData);
            if (noBookingState) noBookingState.classList.add('hidden');
            if (bookingStatusContainer) bookingStatusContainer.classList.remove('hidden');

            appointmentForm.reset();

            // Smooth Scroll to booking status
            bookingStatusContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // Cancel Action
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to cancel this appointment request? This will remove the digital pass from your device.")) {
                localStorage.removeItem('hospital_booking');
                loadSavedBooking();
            }
        });
    }


    /* ==========================================
       4. TESTIMONIALS SLIDER CONTROLS
       ========================================== */
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    const btnPrev = document.getElementById('sliderPrev');
    const btnNext = document.getElementById('sliderNext');
    let currentSlide = 0;
    let autoSlideInterval;

    function showSlide(index) {
        if (slides.length === 0) return;
        
        // Bound checks
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 6000); // Change testimonial every 6 seconds
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(currentSlide - 1);
            startAutoSlide();
        });

        btnNext.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(currentSlide + 1);
            startAutoSlide();
        });
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            const slideIdx = parseInt(dot.getAttribute('data-slide'));
            showSlide(slideIdx);
            startAutoSlide();
        });
    });

    // Pause slider on hover
    const sliderContainer = document.querySelector('.testimonials-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Initialize Testimonial slide
    showSlide(0);
    startAutoSlide();


    /* ==========================================
       5. FAQ ACCORDION HANDLER
       ========================================== */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        if (trigger && content) {
            trigger.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Collapse all other items (Accordion effect)
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-content').style.maxHeight = '0';
                });

                // If not active before, expand this one
                if (!isActive) {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        }
    });

});
