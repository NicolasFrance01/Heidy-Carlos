// Create the array of 62 local photos
const photos = Array.from({ length: 62 }, (_, i) => {
    let layoutClass = '';
    // Adding some random-looking grid layout variations just like before
    if (i % 8 === 0) layoutClass = 'large';
    else if (i % 5 === 0) layoutClass = 'wide';
    else if (i % 7 === 0) layoutClass = 'tall';
    
    return {
        src: `fotos/H_C-${i + 1}.jpg`,
        class: layoutClass,
        alt: `Foto de la boda de C y H - ${i + 1}`
    };
});

let currentPhotoIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initScrollAnimations();
    initLightbox();
    initDownloadAll();
});

// Populate the gallery
function initGallery() {
    const grid = document.getElementById('photo-grid');
    if (!grid) return;

    photos.forEach((photo, index) => {
        const card = document.createElement('div');
        card.className = `photo-card ${photo.class}`;
        card.dataset.index = index;
        
        card.innerHTML = `
            <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
            <div class="photo-overlay">
                <button class="btn-icon view-btn" aria-label="Ver foto" data-index="${index}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Event delegation for opening lightbox
    grid.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-btn');
        const photoCard = e.target.closest('.photo-card');
        
        if (viewBtn) {
            e.stopPropagation();
            openLightbox(parseInt(viewBtn.dataset.index));
        } else if (photoCard) {
            openLightbox(parseInt(photoCard.dataset.index));
        }
    });
}

// Lightbox Logic
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const overlay = document.querySelector('.lightbox-overlay');

    if (!lightbox) return;

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', closeLightbox);
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const imgBody = document.getElementById('lightbox-img');
    const downloadBtn = document.getElementById('lightbox-download');
    
    currentPhotoIndex = index;
    const photo = photos[currentPhotoIndex];
    
    imgBody.src = photo.src;
    imgBody.alt = photo.alt;
    
    // Set the download link (will only really work for same-origin URLs in production)
    downloadBtn.href = photo.src;
    // Extract filename from URL for download attribute or use default
    downloadBtn.download = `C&H_Boda_${index + 1}.jpg`; 

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentPhotoIndex += direction;
    
    // Wrap around
    if (currentPhotoIndex < 0) currentPhotoIndex = photos.length - 1;
    if (currentPhotoIndex >= photos.length) currentPhotoIndex = 0;
    
    openLightbox(currentPhotoIndex);
}

// Scroll Animations (Intersection Observer)
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}

// Download All function (Real Client-Side Zip via JSZip)
function initDownloadAll() {
    const btn = document.getElementById('download-all-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Preparando fotos...';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            const zip = new JSZip();
            const photoFolder = zip.folder("Boda_C_y_H_Fotos");

            // Descargar imágenes concurrentemente y añadirlas al ZIP
            const fetchPromises = photos.map(async (photo, index) => {
                const response = await fetch(photo.src);
                const blob = await response.blob();
                
                // Tratar de obtener la extensión de la URL, si no es posible usar .jpg
                // Como en tu caso usarás las imágenes locales desde Github/Vercel (ej. 'assets/img.jpg'),
                // las URLs serán válidas y la descarga funcionará sin problema CORS.
                const ext = photo.src.split('.').pop().split('?')[0].toLowerCase();
                const validExts = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
                const finalExt = validExts.includes(ext) ? ext : 'jpg';
                
                const filename = `C_H_Boda_Foto_${index + 1}.${finalExt}`;
                photoFolder.file(filename, blob);
            });

            await Promise.all(fetchPromises);

            btn.innerHTML = 'Comprimiendo ZIP...';
            
            // Generar el archivo e iniciar la descarga
            const content = await zip.generateAsync({type:"blob"});
            saveAs(content, "Boda_Carlos_y_Heidy_Fotos.zip");

            // Restaurar botón
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'all';
            
        } catch (error) {
            console.error("Error al generar el ZIP:", error);
            alert("Hubo un error al descargar las fotos. En el entorno de Vercel (mismo dominio), este botón funcionará perfectamente con imágenes locales.");
            
            // Restaurar botón
            btn.innerHTML = 'Descargar Todas';
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'all';
        }
    });
}
