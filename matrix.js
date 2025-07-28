// This script is a module, so it can import from the Firebase SDK script in the HTML.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Matrix Rain Effect ---
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) {
        console.error("Matrix canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const binary = "01";
    const fontSize = 16;
    const columns = canvas.width / fontSize;

    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = binary.charAt(Math.floor(Math.random() * binary.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(drawMatrix, 40);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }, 250);
    });
    
    // --- Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    
    // --- Smooth Scrolling for navigation links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // --- Contact Form & Firebase Logic ---
    const firebaseConfig = typeof window.__firebase_config_dev !== 'undefined' ? window.__firebase_config_dev : null;
    if (!firebaseConfig || !firebaseConfig.apiKey.startsWith("AIza")) {
        console.error("Firebase config not found or is invalid. Please add your Firebase project configuration.");
        return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const contactForm = document.getElementById('contact-form');
    const modal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    const closeModalButton = document.getElementById('close-modal');
    
    const showModal = (message) => {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    };

    const hideModal = () => {
        modal.classList.add('hidden');
    };

    closeModalButton.addEventListener('click', hideModal);

    const authenticate = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Firebase authentication failed:", error);
            showModal("Error: Could not connect to the database.");
        }
    };
    
    authenticate();

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!auth.currentUser) {
            showModal("Authentication in progress. Please try again in a moment.");
            return;
        }

        const name = contactForm.name.value.trim();
        const contactInfo = contactForm['contact-info'].value.trim();
        const description = contactForm.description.value.trim(); // Get description value

        if (!name || !contactInfo) {
            showModal("Please fill out Name and Contact fields.");
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const contactsCollectionRef = collection(db, "contacts");
            
            await addDoc(contactsCollectionRef, {
                name: name,
                contact: contactInfo,
                description: description, // Add description to the database
                submittedAt: serverTimestamp()
            });

            showModal("Success! Your message has been sent.");
            contactForm.reset();

        } catch (error) {
            console.error("Error writing document: ", error);
            showModal("Error: Could not send message. Please try again.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
        }
    });
});
