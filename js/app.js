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

        growthChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1학년 1학기', '1학년 2학기', '2학년 1학기', '2학년 2학기', '3학년 1학기'],
                datasets: [{
                    label: '전공 성적(GPA)',
                    data: [3.5, 3.7, 4.1, 4.4, 4.5],
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#034EA2',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
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
        '01': { title: '반도체설비운용', classes: '설비운용실습, 반도체공학기초', desc: '반도체 8대 공정 설비의 기본 운용 방법과 유지보수 기초를 다지는 과정입니다. 장비의 가동 및 일상 점검 절차를 체화했습니다.', img: 'assets/course_01.png' },
        '02': { title: '반도체설비유지보수', classes: 'PM(Preventive Maintenance) 실습, 불량 분석', desc: '설비 고장 시 기계적/전기적 트러블슈팅 대처 방안과 정기적인 예방 정비(PM) 기술을 실습했습니다.', img: 'assets/course_02.png' },
        '03': { title: '반도체설비자동화', classes: 'PLC 제어, 센서 활용 기술', desc: '자동화 라인의 핵심인 PLC(Programmable Logic Controller) 제어 및 다양한 센서 연동을 통한 무인화 설비 로직을 이해했습니다.', img: 'assets/course_03.png' },
        '04': { title: '반도체장비제어', classes: '모터 제어, 시퀀스 회로 설계', desc: '장비의 정밀 구동을 위한 스텝/서보 모터 제어 및 시퀀스 릴레이 회로 설계 능력을 배양했습니다.', img: 'assets/course_04.png' },
        '05': { title: '반도체설비설계', classes: '2D/3D CAD, 기구학 시뮬레이션', desc: '설비 부품의 도면 작성부터 3D 기구학 모델링 및 역학 시뮬레이션까지, 설비 개발의 엔지니어링 과정을 이수했습니다.', img: 'assets/course_05.png' },
        '06': { title: '반도체장비 S/W 운용', classes: 'C/C++ 프로그래밍, 설비 통신(SECS/GEM)', desc: '설비와 공장 호스트 간의 SECS/GEM 통신 프로토콜 기초 및 장비 상태 모니터링 소프트웨어 작성 능력을 길렀습니다.', img: 'assets/course_06.png' },
        '07': { title: '반도체 공정/설비기초', classes: '반도체 재료, 공학 기초', desc: '엔지니어가 기본적으로 갖추어야 할 반도체의 물리적/화학적 특징과 웨이퍼 가공 공학 지식을 학습했습니다.', img: 'assets/course_07.png' }
    };

    const modal = document.getElementById('course-modal');
    const modalClose = document.querySelector('.close-modal');
    const degreeCards = document.querySelectorAll('.degree-card');

    degreeCards.forEach(card => {
        card.addEventListener('click', () => {
            const courseId = card.getAttribute('data-course');
            const data = courseData[courseId];
            if(data && modal) {
                document.getElementById('modal-title').textContent = data.title;
                document.getElementById('modal-badge').textContent = `Course ${courseId}`;
                document.getElementById('modal-classes').textContent = data.classes;
                document.getElementById('modal-desc').textContent = data.desc;
                
                const imgElement = document.getElementById('modal-img');
                imgElement.src = data.img;
                
                modal.classList.add('active');
            }
        });
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

});
