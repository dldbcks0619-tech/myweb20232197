// Preload all image assets to prevent late loading issues
const preloadImages = () => {
    const images = [
        'assets/image_3.png',
        'assets/advanced_design.png',
        'assets/semiconductor_future.png',
        'assets/course_01.png',
        'assets/course_02.png',
        'assets/course_03.png',
        'assets/course_04.png',
        'assets/course_05.png',
        'assets/course_06.png',
        'assets/course_07.png',
        'assets/creative_1.png',
        'assets/robot_basic.png',
        'assets/plc_logic.png'
    ];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
};
preloadImages();

document.addEventListener('DOMContentLoaded', () => {
    // SPA Routing Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Create scannning effect element
    const scanner = document.createElement('div');
    scanner.className = 'scanning-effect';
    document.body.appendChild(scanner);

    let growthChartInstance = null;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-section');
            
            if (e.target.classList.contains('active')) return;

            // Trigger scanner animation
            scanner.classList.remove('scanning');
            void scanner.offsetWidth; // trigger reflow
            scanner.classList.add('scanning');

            // Update Active Nav Link
            navLinks.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');

            // Wait a brief moment for scanning effect to cover partially before switching content
            setTimeout(() => {
                sections.forEach(section => {
                    section.classList.remove('active');
                });
                const targetSection = document.getElementById(targetId);
                if(targetSection) {
                    targetSection.classList.add('active');
                    
                    // If target is home, re-render chart for animation
                    if(targetId === 'home') {
                        initChart();
                    }
                }
            }, 300);
        });
    });

    // Chart.js Setup
    function initChart() {
        const ctx = document.getElementById('growthChart')?.getContext('2d');
        if (!ctx) return;

        if (growthChartInstance) {
            growthChartInstance.destroy();
        }

        Chart.defaults.color = '#94A3B8';
        Chart.defaults.font.family = "'Inter', 'Noto Sans KR', sans-serif";

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.6)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

        growthChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1학년 1학기', '1학년 2학기', '2학년 1학기', '2학년 2학기', '3학년 1학기', '3학년 2학기'],
                datasets: [{
                    label: '전공 성적(GPA)',
                    data: [3.5, 3.7, 4.1, 4.4, 4.5, 4.5],
                    clip: false,
                    borderColor: '#D4AF37',
                    backgroundColor: gradient,
                    borderWidth: 4,
                    pointBackgroundColor: '#0a0a0f',
                    pointBorderColor: '#D4AF37',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: '#D4AF37',
                    pointHoverBorderColor: '#fff',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                layout: {
                    padding: {
                        top: 30,
                        right: 20,
                        left: 10,
                        bottom: 10
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 30, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#D4AF37',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        min: 3.0,
                        max: 4.5,
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 0.5
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Initialize Chart on load
    initChart();
    // Course Modal Logic
    const courseData = {
        '01': { title: '반도체설비운용', desc: '반도체 8대 공정 설비의 기본 운용 방법과 일상 점검 절차를 학습하며 설비 유지보수의 기초를 다집니다.', img: 'assets/course_01.png' },
        '02': { title: '반도체설비유지보수', desc: '설비 고장 시 기계적/전기적 트러블슈팅 대처 방안과 정기적인 예방 정비(PM) 기술을 습득합니다.', img: 'assets/course_02.png' },
        '03': { title: '반도체설비자동화', desc: '자동화 라인의 핵심인 PLC 제어 및 센서 연동을 통한 무인화 설비 구동 로직을 이해합니다.', img: 'assets/course_03.png' },
        '04': { title: '반도체장비제어', desc: '장비의 정밀 구동을 위한 모터 제어 및 시퀀스 회로 설계 능력을 배양합니다.', img: 'assets/course_04.png' },
        '05': { title: '반도체설비설계', desc: '2D/3D CAD를 이용한 부품 도면 작성부터 기구학 시뮬레이션까지 설비 개발의 전 과정을 이수합니다.', img: 'assets/course_05.png' },
        '06': { title: '반도체장비 S/W 운용', desc: '설비 통신 표준인 SECS/GEM 프로토콜 기초 및 장비 상태 모니터링 소프트웨어 기술을 학습합니다.', img: 'assets/course_06.png' },
        '07': { title: '반도체 공정/설비기초', desc: '반도체의 물리적/화학적 특징과 웨이퍼 가공 공학 지식을 통해 설비 직무의 기술적 기반을 확립합니다.', img: 'assets/course_07.png' }
    };

    const yearData = {
        '1': { 
            title: '1학년: 엔지니어링의 기초 확립', 
            desc: '엔지니어링의 근간이 되는 기초 학문과 설계 도구 활용 능력을 습득한 시기입니다. 3차원 CAD를 통한 기구 설계의 기초를 다지고, 창의적공학설계 프로젝트를 통해 공학적 문제 해결 프로세스를 처음으로 경험하며 설계 공모전 수상이라는 성과를 거두었습니다.',
            img: 'assets/creative_1.png',
            detailed: true
        },
        '2': { 
            title: '2학년: 전공 심화 및 제어 역량 강화', 
            desc: '로봇공학의 핵심 이론과 프로그래밍 역량을 집중적으로 강화한 시기입니다. 파이썬, 아두이노 등을 활용한 임베디드 제어와 로봇 기구학/동역학 해석 능력을 갖추었으며, 이를 바탕으로 더 정밀하고 복잡한 시스템을 설계할 수 있는 기술적 토대를 마련했습니다.',
            img: 'assets/robot_basic.png',
            detailed: true
        },
        '3': { 
            title: '3학년: 산업 실무 통합 및 전문가 과정', 
            desc: '산업 현장에서 즉각 활용 가능한 실무 제어 로직과 전문 직무 역량을 완성하는 단계입니다. PLC 프로그래밍과 마이크로컨트롤러 제어를 통해 삼성전자 설비 직무에 필수적인 자동화 제어 능력을 마스터했습니다. 3년 연속 설계 수상으로 증명된 실무 최적화 엔지니어의 면모를 갖췄습니다.',
            img: 'assets/plc_logic.png',
            detailed: true
        }
    };

    const modal = document.getElementById('course-modal');
    const modalClose = document.querySelector('.close-modal');
    const masteryCards = document.querySelectorAll('.mastery-card');
    const yearCards = document.querySelectorAll('.clickable-year');

    function openModal(data, id) {
        if(!data || !modal) return;
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-badge').textContent = data.detailed ? `Year Summary` : `Course Info`;
        document.getElementById('modal-desc').textContent = data.desc;
        
        const imgElement = document.getElementById('modal-img');
        const modalContent = modal.querySelector('.modal-content');
        
        if (data.img) {
            imgElement.src = data.img;
            imgElement.style.display = 'block';
            modal.querySelector('.modal-grid').style.gridTemplateColumns = '1fr 1.2fr';
        } else {
            imgElement.style.display = 'none';
            modal.querySelector('.modal-grid').style.gridTemplateColumns = '1fr';
        }

        if (data.detailed) {
            modalContent.style.border = '1px solid var(--gold)';
        } else {
            modalContent.style.border = '1px solid var(--glass-border)';
        }
        
        modal.classList.add('active');
    }

    masteryCards.forEach((card) => {
        card.addEventListener('click', () => {
            const courseId = card.getAttribute('data-course');
            if (!courseId) return;
            const data = courseData[courseId];
            openModal(data, courseId);
        });
    });

    yearCards.forEach(card => {
        card.addEventListener('click', () => {
            const yearId = card.getAttribute('data-year');
            const data = yearData[yearId];
            openModal(data, yearId);
        });
        card.style.cursor = 'pointer';
    });

    if(modalClose && modal) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // --- Background Animation System ---
    const particleContainer = document.getElementById('particle-container');
    const particleCount = 25; // Slightly more particles
    const particles = [];

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 250 + 150; // Larger particles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.opacity = Math.random() * 0.6 + 0.2; // Higher opacity
        
        particleContainer.appendChild(particle);
        
        return {
            element: particle,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.8, // Slightly faster
            vy: (Math.random() - 0.5) * 0.8,
            size: size
        };
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
    }

    // Tech dots (smaller, sharper)
    for (let i = 0; i < 40; i++) { // More tech dots
        const dot = document.createElement('div');
        dot.className = 'tech-dot';
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        dot.style.animation = `pulse ${Math.random() * 3 + 2}s infinite alternate ${Math.random() * 2}s`;
        particleContainer.appendChild(dot);
    }

    function animateBackground() {
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around screen
            if (p.x < -p.size) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = -p.size;
            if (p.y < -p.size) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = -p.size;
            
            p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
        });
        
        requestAnimationFrame(animateBackground);
    }

    animateBackground();

    // Subtle Mouse Interaction
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        particles.forEach(p => {
            const dx = mouseX - (p.x + p.size / 2);
            const dy = mouseY - (p.y + p.size / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                const force = (300 - dist) / 300;
                p.vx -= dx * force * 0.001;
                p.vy -= dy * force * 0.001;
            }
        });
    });

});
