/* ===================================================== */
/* ============= HELP PAGE JS ========================== */
/* ===================================================== */

// Toggle FAQ accordion
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');

    answer.classList.toggle('show');
    icon.classList.toggle('rotated');
}

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactMessage').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        await apiRequest(API_CONFIG.ENDPOINTS.SUPPORT_CONTACT, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        // Show success message
        document.getElementById('successMessage').classList.add('show');
        document.getElementById('contactForm').reset();

        // Scroll to success message
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Hide success message after 5 seconds
        setTimeout(() => {
            document.getElementById('successMessage').classList.remove('show');
        }, 5000);

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again or email support@edushare.com directly.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
});
