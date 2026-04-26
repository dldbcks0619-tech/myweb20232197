/**
 * High-Fidelity G-NUSMAS with Cinematic Motion
 * - Motion: Replicated from reference (Bobbing, Auto-rotation, Drag Interaction)
 * - Rendering: Corrected lighting & layering to ensure visibility
 * - Layout: Bubble and Chat securely anchored inside the fixed overlay container.
 */
class CinematicGNusmas {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gnusmas = null;
        
        this.isChatOpen = false;
        this.isTyping = false;
        this.clock = new THREE.Clock();
        
        // Motion variables
        this.mouse = new THREE.Vector2();
        this.targetRotationY = 0;
        this.currentRotationY = 0;
        this.isDragging = false;
        this.previousMouseX = 0;

        // Model parts
        this.head = null;
        this.appendages = [];
        this.leftEye = null;
        this.rightEye = null;

        this.init();
    }

    async init() {
        this.createContainer();
        this.setupScene();
        this.createModel();
        this.createUI();
        this.animate();
        this.bindEvents();
    }

    createContainer() {
        const existing = document.getElementById('cinematic-gnusmas-overlay');
        if (existing) existing.remove();
        
        this.container = document.createElement('div');
        this.container.id = 'cinematic-gnusmas-overlay';
        this.container.style.cssText = `
            position: fixed;
            bottom: -10px;
            right: -20px;
            width: 320px;
            height: 320px;
            z-index: 10000;
            pointer-events: none;
            touch-action: none;
        `;
        document.body.appendChild(this.container);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
        this.camera.position.set(0, 1.2, 5.5);
        
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(320, 320);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.cursor = 'grab';
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);
        
        const main = new THREE.DirectionalLight(0xffffff, 1.2);
        main.position.set(5, 10, 7.5);
        this.scene.add(main);
        
        const blueRim = new THREE.PointLight(0x00ffff, 1, 10);
        blueRim.position.set(-3, 2, 2);
        this.scene.add(blueRim);
    }

    createModel() {
        this.gnusmas = new THREE.Group();
        this.gnusmas.scale.set(0.9, 0.9, 0.9); // 0.9 scale (10% reduction)
        
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.4 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.5 });
        const sweaterMat = new THREE.MeshStandardMaterial({ color: 0x1473E6, roughness: 0.8 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 });

        this.head = new THREE.Group();
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), skinMat);
        headMesh.scale.set(1.1, 1.05, 1);
        this.head.add(headMesh);

        const appPos = [
            { x: -0.25, y: 0.45, z: 0, rz: -0.4 },
            { x: 0.25, y: 0.45, z: 0, rz: 0.4 },
            { x: -0.45, y: 0.2, z: -0.1, rz: -0.8 },
            { x: -0.4, y: 0.05, z: -0.15, rz: -1.2 }
        ];
        appPos.forEach(p => {
            const ear = new THREE.Group();
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), skinMat);
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
            cap.position.y = 0.15;
            const capBottom = cap.clone();
            capBottom.position.y = -0.15;
            ear.add(stalk, cap, capBottom);
            
            ear.position.set(p.x, p.y, p.z);
            ear.rotation.z = p.rz;
            this.head.add(ear);
            this.appendages.push(ear);
        });

        const createEye = (x) => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), eyeMat);
            eye.scale.set(1, 1.2, 0.4);
            eye.position.set(x, 0, 0.45); 
            const refl = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            refl.position.set(0.05, 0.05, 0.18); 
            eye.add(refl);
            return eye;
        };
        this.leftEye = createEye(-0.25);
        this.rightEye = createEye(0.25);
        this.head.add(this.leftEye, this.rightEye);

        this.head.position.y = 1.8;
        this.gnusmas.add(this.head);

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 32), sweaterMat);
        torso.position.y = 1.05;
        this.gnusmas.add(torso);

        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 16, 32), pinkMat);
        collar.rotation.x = Math.PI/2;
        collar.position.y = 1.45;
        this.gnusmas.add(collar);

        this.scene.add(this.gnusmas);
    }

    createUI() {
        // Appending UI elements to the container instead of body guarantees perfect relative positioning
        this.bubble = document.createElement('div');
        this.bubble.style.cssText = `
            position: absolute; top: 30px; right: 110px; background: #1473E6; color: white;
            padding: 8px 15px; border-radius: 15px 15px 0 15px; font-size: 0.85rem; font-weight: bold;
            opacity: 0; transition: 0.5s; pointer-events: none; font-family: 'Noto Sans KR', sans-serif;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2); white-space: nowrap;
        `;
        this.bubble.innerHTML = "궁금한 게 있으면 물어봐! ✨";
        this.container.appendChild(this.bubble);

        this.chat = document.createElement('div');
        this.chat.style.cssText = `
            position: absolute; bottom: 250px; right: 20px; width: 280px; background: white;
            border-radius: 20px; padding: 1.5rem; display: none; flex-direction: column;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2); font-family: 'Noto Sans KR', sans-serif; pointer-events: auto;
            box-sizing: border-box;
        `;
        this.chat.innerHTML = `
            <div style="font-weight: 900; color: #1473E6; margin-bottom: 10px;">G-NUSMAS AI</div>
            <div id="gn-ans" style="font-size: 0.9rem; color: #333; margin-bottom: 15px; line-height: 1.4;">반가워요! 무엇을 도와드릴까요?</div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="gn-in" placeholder="질문 입력..." style="flex:1; border:1px solid #eee; border-radius: 8px; padding: 8px 10px; outline:none; font-family: 'Noto Sans KR', sans-serif; font-size: 0.85rem; min-width: 0;">
                <button id="gn-send" style="background:#1473E6; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:bold; font-family: 'Noto Sans KR', sans-serif; font-size: 0.85rem; white-space: nowrap; flex-shrink: 0; min-width: 50px;">전송</button>
            </div>
        `;
        this.container.appendChild(this.chat);
    }

    jump() {
        this.isJumping = true;
        this.jumpStartTime = this.clock.getElapsedTime();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();
        
        const isSplashVisible = !sessionStorage.getItem('splashShown');
        const aiChatSection = document.getElementById('ai-chat');
        const isAiChatActive = aiChatSection && aiChatSection.classList.contains('active');
        
        if (isSplashVisible || isAiChatActive) {
            this.container.style.visibility = 'hidden';
            return; 
        } else {
            this.container.style.visibility = 'visible';
            if (this.bubble && !this.isChatOpen) this.bubble.style.visibility = 'visible';
            if (this.chat && this.isChatOpen) this.chat.style.visibility = 'visible';
        }

        if (this.gnusmas) {
            let yOffset = -0.35 + Math.sin(time * 1.5) * 0.1;
            if (this.isJumping) {
                const jumpDuration = 0.5;
                const timeSinceJump = time - this.jumpStartTime;
                if (timeSinceJump < jumpDuration) {
                    const progress = timeSinceJump / jumpDuration;
                    yOffset += Math.sin(progress * Math.PI) * 0.4;
                } else {
                    this.isJumping = false;
                }
            }
            this.gnusmas.position.y = yOffset;
            
            this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, -this.mouse.y * 0.2, 0.1);
            this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, this.mouse.x * 0.3, 0.1);
            
            if (!this.isDragging) {
                this.targetRotationY += 0.005;
            }
            this.currentRotationY = THREE.MathUtils.lerp(this.currentRotationY, this.targetRotationY, 0.05);
            this.gnusmas.rotation.y = this.currentRotationY;

            this.appendages.forEach((a, i) => {
                a.rotation.x = Math.sin(time * 3 + i) * 0.05;
            });

            const blink = Math.sin(time * 4) > 0.98 ? 0.1 : 1;
            this.leftEye.scale.y = blink;
            this.rightEye.scale.y = blink;
        }

        if (!this.isChatOpen) {
            this.bubble.style.opacity = (time % 5 < 1) ? "1" : "0";
        }

        this.renderer.render(this.scene, this.camera);
    }

    bindEvents() {
        const dom = this.renderer.domElement;
        
        dom.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.previousMouseX = e.clientX;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            dom.style.cursor = 'grabbing';
            try { dom.setPointerCapture(e.pointerId); } catch(err) {}
        });

        window.addEventListener('pointermove', (e) => {
            const rect = dom.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (this.isDragging) {
                const deltaX = e.clientX - this.previousMouseX;
                this.targetRotationY += deltaX * 0.01;
                this.previousMouseX = e.clientX;
            }
        });

        const endDrag = (e) => {
            this.isDragging = false;
            dom.style.cursor = 'grab';
            try { dom.releasePointerCapture(e.pointerId); } catch(err) {}
        };
        dom.addEventListener('pointerup', endDrag);
        dom.addEventListener('pointercancel', endDrag);

        dom.addEventListener('click', (e) => {
            const dist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
            if (dist < 5) {
                this.jump();
                this.toggleChat();
            }
        });

        document.getElementById('gn-send').onclick = () => this.handleSend();
        document.getElementById('gn-in').onkeypress = (e) => { if(e.key==='Enter') this.handleSend(); };
    }

    toggleChat(force) {
        this.isChatOpen = force !== undefined ? force : !this.isChatOpen;
        this.chat.style.display = this.isChatOpen ? 'flex' : 'none';
        this.bubble.style.opacity = "0";
        if (this.isChatOpen) document.getElementById('gn-in').focus();
    }

    async handleSend() {
        const inp = document.getElementById('gn-in');
        const text = inp.value.trim();
        if (!text) return;
        inp.value = '';
        const ans = document.getElementById('gn-ans');
        ans.textContent = "...";
        if (typeof fetchFromAIAPI === 'function') {
            const res = await fetchFromAIAPI(text);
            ans.textContent = res;
        } else {
            setTimeout(() => { ans.textContent = "답변을 준비 중입니다."; }, 1000);
        }
    }
}

(function() {
    const start = () => {
        if (window.THREE) new CinematicGNusmas();
        else {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            s.onload = () => new CinematicGNusmas();
            document.head.appendChild(s);
        }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
})();
