/**
 * Features JS - Handles Free Board CRUD, Footer Injection, and Email Inquiry
 * Last Updated: 2026-04-16 (Ver 1.2 - Cloud Sync)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Footer (Matching the photo's structure)
    const footer = document.createElement('footer');
    footer.className = 'footer-contact';
    footer.innerHTML = `
        <div class="footer-address">
            [08221] 서울시 구로구 경인로 445 ([구]고척동 62-160) 동양미래대학교
        </div>
        <div class="footer-info">
            <span><strong>Department:</strong> 로봇자동화공학부</span>
            <span><strong>Tel:</strong> 010-3846-0536</span>
            <span><strong>e-mail:</strong> dldbcks0619@naver.com</span>
        </div>
    `;
    document.body.appendChild(footer);

    // 2. Free Board Logic
    let isAdmin = false;

    const boardList = document.getElementById('board-list');
    const postForm = document.getElementById('post-form');
    const formOverlay = document.getElementById('board-form-overlay');
    const btnNewPost = document.getElementById('btn-new-post');
    const btnCancel = document.getElementById('btn-cancel');
    
    // Initial data to show it's working
    const SUPABASE_URL = 'https://cvpujqfudfkcdqbbfvwu.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_OPaTzO9-C1NcTtZ7bAN-Gw_sJHJNv2B';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let posts = [];
    let currentSort = 'newest';

    // Load posts from Supabase
    const loadPosts = window.loadPosts = async () => {
        try {
            const { data, error } = await _supabase
                .from('posts')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            
            if (JSON.stringify(posts) !== JSON.stringify(data)) {
                posts = data || [];
                renderPosts();
            }
        } catch (e) {
            console.error('Failed to load posts from Supabase', e);
        }
    }

    function renderPosts() {
        if (!boardList) return;
        boardList.innerHTML = '';
        
        // Sorting Logic
        let sortedPosts = [...posts];

        if (posts.length === 0) {
            boardList.innerHTML = '<div style="text-align:center; padding: 3rem; color: #888;">작성된 게시글이 없습니다. 첫 글을 남겨주세요!</div>';
            return;
        }
        
        if (currentSort === 'upvotes') {
            sortedPosts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else if (currentSort === 'downvotes') {
            sortedPosts.sort((a, b) => (b.downvotes || 0) - (a.downvotes || 0));
        } else {
            // Newest (Default) - Fetch has id DESC
        }

        // Pinning Sort: is_pinned DESC, then pin_order ASC, then fallback
        sortedPosts.sort((a, b) => {
            const aPinned = a.is_pinned ? 1 : 0;
            const bPinned = b.is_pinned ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            
            if (a.is_pinned && b.is_pinned) {
                return (a.pin_order || 99) - (b.pin_order || 99);
            }
            return 0;
        });

        sortedPosts.forEach(post => {
            const item = document.createElement('div');
            item.className = `board-item ${post.is_pinned ? 'pinned' : ''}`;

            const isPrivate = post.is_private || post.isPrivate; // Support both naming conventions
            if (isPrivate && !isAdmin) {
                item.innerHTML = `
                    <div class="board-item-header" style="opacity: 0.6; border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                        <span class="board-item-title" style="color: #888;">🔒 관리자만 볼 수 있는 비밀글입니다.</span>
                        <span class="board-item-meta">${post.author} | ${post.date}</span>
                    </div>
                `;
            } else {
                const lockHtml = isPrivate ? '<span style="color: #ff9900; margin-right: 5px;">🔒 [비공개]</span>' : '';
                const pinHtml = post.is_pinned ? '<span style="color: #ff4d4d; margin-right: 5px;">📌 [고정]</span>' : '';
                const replyHtml = post.reply ? `
                    <div class="board-item-reply" style="margin-top: 1rem; padding: 1rem; background: rgba(20, 115, 230, 0.1); border-left: 3px solid var(--samsung-blue); border-radius: 4px;">
                        <div style="font-weight: bold; color: var(--samsung-light-blue); margin-bottom: 0.5rem;">[관리자 답글] <small style="color: #888; font-weight: normal;">${post.reply_date || ''}</small></div>
                        <div style="color: #ddd;">${post.reply}</div>
                    </div>
                ` : '';
                
                const userVote = localStorage.getItem(`vote_${post.id}`); // 'up', 'down', or null

                const actionsHtml = `
                    <div class="board-item-actions">
                        <div class="vote-buttons">
                            <button class="btn-vote ${userVote === 'up' ? 'active' : ''}" onclick="votePost('${post.id}', 'up')">👍 <span>${post.upvotes || 0}</span></button>
                            <button class="btn-vote ${userVote === 'down' ? 'active' : ''}" onclick="votePost('${post.id}', 'down')">👎 <span>${post.downvotes || 0}</span></button>
                        </div>
                        <div class="edit-delete-actions">
                            ${isAdmin ? `<button class="btn-small" onclick="togglePin('${post.id}', ${!!post.is_pinned})" style="color: #ff4d4d;">${post.is_pinned ? '고정 해제' : '상단 고정'}</button>` : ''}
                            <button class="btn-small" onclick="editPost('${post.id}')" style="color: #ffd700;">수정</button>
                            <button class="btn-small" onclick="deletePost('${post.id}')" style="color: #ff4d4d;">삭제</button>
                            ${isAdmin ? `<button class="btn-small btn-reply" onclick="adminReply(${post.id})">답글 달기</button>` : ''}
                        </div>
                    </div>
                `;

                item.innerHTML = `
                    <div class="board-item-header">
                        <span class="board-item-title">${pinHtml}${lockHtml}${post.title}</span>
                        <div class="post-meta">
                            <span class="post-author">${post.author}</span>
                            <span class="post-date">${post.date}${post.is_edited ? ' <small style="opacity: 0.6;">(수정됨)</small>' : ''}</span>
                        </div>
                    </div>
                    <div class="board-item-content">${post.content}</div>
                    ${replyHtml}
                    ${actionsHtml}
                `;
            }
            boardList.appendChild(item);
        });
    }

    window.savePost = async (e) => {
        e.preventDefault();
        
        const submitBtn = postForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = '클라우드에 저장 중...';
        submitBtn.disabled = true;

        const id = document.getElementById('post-id').value;
        const title = document.getElementById('post-title').value;
        const author = document.getElementById('post-author').value;
        const content = document.getElementById('post-content').value;

        // Restriction: Only admin can use the name "관리자"
        if (author.trim() === '관리자' && !isAdmin) {
            alert('🚨 "관리자" 이름은 관리자 모드에서만 사용 가능합니다.\n다른 닉네임을 사용해주세요.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        const password = document.getElementById('post-password').value;
        const isPrivate = document.getElementById('post-private').checked;
        const date = new Date().toISOString().split('T')[0];

        const isPinned = document.getElementById('post-pinned') ? document.getElementById('post-pinned').checked : false;
        const pinOrder = document.getElementById('pin-order') ? parseInt(document.getElementById('pin-order').value) : 1;

        try {
            if (id) {
                const oldPost = posts.find(p => p.id == id);
                const hasChanged = oldPost && (oldPost.title !== title || oldPost.content !== content);
                
                const updateData = { title, author, content, password, is_private: isPrivate };
                if (hasChanged) updateData.is_edited = true;

                // Admin specific fields
                if (isAdmin) {
                    updateData.is_pinned = isPinned;
                    updateData.pin_order = pinOrder;
                }

                const { error } = await _supabase
                    .from('posts')
                    .update(updateData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const insertData = { title, author, content, date, password, is_private: isPrivate, created_at: new Date().toISOString() };
                if (isAdmin) {
                    insertData.is_pinned = isPinned;
                    insertData.pin_order = pinOrder;
                }

                const { error } = await _supabase
                    .from('posts')
                    .insert([insertData]);
                if (error) throw error;
            }
            closeForm();
            loadPosts(); // Immediate local refresh
        } catch (e) {
            console.error('Supabase Save Error:', e);
            const isLocal = window.location.protocol === 'file:';
            let msg = '🚨 클라우드 저장 실패!\n\n데이터베이스 연결에 문제가 발생했습니다.';
            if (isLocal) {
                msg += '\n\n현재 폴더에서 직접 파일을 여셨습니다(file:/// 시작).\n보안 정책상 서버 통신이 차단될 수 있으니, VS Code의 "Live Server"로 실행하거나 Github/Vercel에 배포 후 테스트해주세요.';
            } else {
                msg += '\n\nSupabase 설정(SQL 실행 여부 및 API 키)을 다시 한번 확인해주세요.';
            }
            alert(msg);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    };

    window.deletePost = async (id) => {
        const post = posts.find(p => p.id == id);
        if (!post) return;

        const performDelete = async () => {
            try {
                const { error } = await _supabase
                    .from('posts')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                console.error('Supabase Delete Error:', e);
                alert('삭제 중 오류가 발생했습니다.');
            }
        };

        if (isAdmin) {
            if (confirm('[관리자 권한] 클라우드 DB에서 완전히 삭제하시겠습니까?')) {
                await performDelete();
            }
            return;
        }

        const inputPw = prompt('글 작성 시 설정한 비밀번호를 입력해주세요.\n(본인 또는 관리자만 삭제 가능합니다)');
        if (inputPw === null) return;

        if (inputPw === post.password || inputPw === '0619') {
            if (confirm('정말로 삭제하시겠습니까? 모든 사람의 화면에서 삭제됩니다.')) {
                await performDelete();
            }
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    window.togglePin = async (id, currentPinned) => {
        if (!isAdmin) return;
        
        try {
            const { error } = await _supabase
                .from('posts')
                .update({ is_pinned: !currentPinned })
                .eq('id', id);

            if (error) throw error;
            loadPosts();
        } catch (e) {
            console.error('Supabase Pin Error:', e);
            alert('상태 변경에 실패했습니다.');
        }
    };

    window.adminReply = async (id) => {
        if (!isAdmin) {
            alert('관리자만 답글을 달 수 있습니다.');
            return;
        }

        const post = posts.find(p => p.id == id);
        if (!post) return;

        const replyContent = prompt('답글 내용을 입력해주세요.\n(기존 답글이 있으면 덮어씌워집니다)', post.reply || '');
        if (replyContent === null) return;

        try {
            const replyDate = new Date().toISOString().split('T')[0];
            const { error } = await _supabase
                .from('posts')
                .update({ reply: replyContent, reply_date: replyDate })
                .eq('id', id);
            
            if (error) throw error;
            alert('답글이 저장되었습니다.');
            loadPosts(); // Immediate local refresh
        } catch (e) {
            console.error('Supabase Reply Error:', e);
            alert('답글 저장 중 오류가 발생했습니다. (Supabase 컬럼 확인 필요)');
        }
    };

    window.votePost = async (id, type) => {
        try {
            const post = posts.find(p => p.id == id);
            if (!post) return;

            const storageKey = `vote_${id}`;
            const currentVote = localStorage.getItem(storageKey); // 'up', 'down', or null
            
            let updateData = {};

            if (currentVote === type) {
                // Toggle OFF: Same button clicked again
                const column = type === 'up' ? 'upvotes' : 'downvotes';
                updateData[column] = Math.max(0, (post[column] || 0) - 1);
                localStorage.removeItem(storageKey);
            } else if (currentVote) {
                // Swap: Different button clicked
                const oldColumn = currentVote === 'up' ? 'upvotes' : 'downvotes';
                const newColumn = type === 'up' ? 'upvotes' : 'downvotes';
                updateData[oldColumn] = Math.max(0, (post[oldColumn] || 0) - 1);
                updateData[newColumn] = (post[newColumn] || 0) + 1;
                localStorage.setItem(storageKey, type);
            } else {
                // New Vote
                const column = type === 'up' ? 'upvotes' : 'downvotes';
                updateData[column] = (post[column] || 0) + 1;
                localStorage.setItem(storageKey, type);
            }

            const { error } = await _supabase
                .from('posts')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
            loadPosts(); // Refresh
        } catch (e) {
            console.error('Supabase Vote Error:', e);
            alert('추천/비추천 처리 중 오류가 발생했습니다.');
        }
    };

    // 실시간 동기화 설정 (초기 로드 및 채널 구독)
    loadPosts();

    // Supabase Realtime: 게시물 변경 감지 시 즉시 다시 로드
    _supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            loadPosts();
        })
        .subscribe();

    function closeForm() {
        formOverlay.style.display = 'none';
        postForm.reset();
        if (document.getElementById('post-pinned')) document.getElementById('post-pinned').checked = false;
        if (document.getElementById('pin-order')) document.getElementById('pin-order').value = '1';
        if (document.getElementById('pin-order-wrap')) document.getElementById('pin-order-wrap').style.display = 'none';
        
        document.getElementById('form-title').textContent = '새 글 쓰기';
        postForm.querySelector('button[type="submit"]').textContent = '저장하기';
    }

            // Show admin controls only in admin mode
            const adminControls = document.querySelectorAll('.admin-only');
            adminControls.forEach(ctrl => ctrl.style.display = isAdmin ? 'flex' : 'none');
            
            formOverlay.style.display = 'flex';
        });
    }

    const pinCheckbox = document.getElementById('post-pinned');
    if (pinCheckbox) {
        pinCheckbox.addEventListener('change', () => {
            const wrap = document.getElementById('pin-order-wrap');
            if (wrap) wrap.style.display = pinCheckbox.checked ? 'flex' : 'none';
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', closeForm);
    }

    let logoClickCount = 0;
    let logoClickTimer = null;
    const adminLogoBtn = document.querySelector('.logo-samsung');

    if (adminLogoBtn) {
        adminLogoBtn.style.cursor = 'pointer'; // Make it look clickable, or hidden as requested (we won't add hover effect to keep it hidden)
        adminLogoBtn.addEventListener('click', () => {
            logoClickCount++;
            
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => {
                logoClickCount = 0;
            }, 2500); // 2.5초 내에 5번 클릭 (모바일 배려)

            if (logoClickCount >= 5) {
                logoClickCount = 0;
                
                if (isAdmin) {
                    if (confirm('관리자 모드를 종료하시겠습니까?')) {
                        isAdmin = false;
                        renderPosts();
                    }
                    return;
                }

                const pw = prompt('관리자 비밀번호를 입력해주세요.');
                if (pw === '0619') {
                    isAdmin = true;
                    alert('관리자 모드가 활성화되었습니다.\n모든 비밀글을 볼 수 있고, 모든 글을 삭제할 수 있습니다.');
                    renderPosts();
                } else if (pw !== null) {
                    alert('좋은 평가 부탁드립니다.');
                }
            }
        });
    }

    window.editPost = async (id) => {
        const post = posts.find(p => p.id == id);
        if (!post) return;

        if (!isAdmin) {
            const inputPw = prompt('게시물 비밀번호를 입력해주세요.');
            if (inputPw !== post.password) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }
        }

        // Populate form
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-author').value = post.author;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-password').value = post.password;
        document.getElementById('post-private').checked = post.is_private;
        
        if (isAdmin) {
            const pinCheck = document.getElementById('post-pinned');
            const pinOrderInput = document.getElementById('pin-order');
            const pinOrderWrap = document.getElementById('pin-order-wrap');
            if (pinCheck) pinCheck.checked = post.is_pinned;
            if (pinOrderInput) pinOrderInput.value = post.pin_order || 1;
            if (pinOrderWrap) pinOrderWrap.style.display = post.is_pinned ? 'flex' : 'none';
            
            const adminControls = document.querySelectorAll('.admin-only');
            adminControls.forEach(ctrl => ctrl.style.display = 'flex');
        } else {
            const adminControls = document.querySelectorAll('.admin-only');
            adminControls.forEach(ctrl => ctrl.style.display = 'none');
        }

        document.getElementById('form-title').textContent = '게시물 수정';
        postForm.querySelector('button[type="submit"]').textContent = '수정 완료';
        formOverlay.style.display = 'flex';
    };

    // Email Logic using AJAX via FormSubmit for seamless background sending
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = inquiryForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = '메일 전송 중...';
            submitBtn.disabled = true;

            const formData = new FormData(inquiryForm);
            // Include predefined hidden fields
            formData.append('_subject', '[포트폴리오 문의] 새로운 연락이 도착했습니다.');
            formData.append('_captcha', 'false');

            const data = Object.fromEntries(formData.entries());

            fetch("https://formsubmit.co/ajax/dldbcks0619@naver.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success === true || data.success === "true") {
                    alert('성공적으로 메일이 전송되었습니다!');
                    inquiryForm.reset();
                } else if (data.message && data.message.includes("web server")) {
                    alert('🚨 안내: 현재 폴더에서 더블클릭으로 화면을 열어주셨네요(주소창이 file:/// 시작). 서버 스팸 방지 정책상 폴더에서 열면 메일이 발송되지 않습니다!\n\n※ 걱정하지 마세요. 나중에 이 코드를 인터넷에 올리면(Github 배포 등) 완벽히 자동으로 전송됩니다. 당장 테스트하시려면 VS Code의 "Live Server(Go Live)" 기능으로 화면을 띄워주세요.');
                } else {
                    alert('최초 1회 보안 인증이 필요합니다!\n본인 네이버 메일(dldbcks0619@naver.com)의 "받은 편지함" 또는 "스팸 메일함"을 확인하셔서 FormSubmit에서 온 "Activate" 버튼을 딱 한 번만 눌러주세요. 그 이후엔 바로 전송됩니다.');
                }
            })
            .catch(error => {
                console.error(error);
                alert('전송 중 오류가 발생했습니다. 인터넷 오류 또는 차단 시도입니다.');
            })
            .finally(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    }

    renderPosts();

    // Fix for SPA Routing with new menu
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const scanner = document.querySelector('.scanning-effect');

    // Add listener to the newly added link specifically to ensure it works
    const boardLink = document.querySelector('.nav-link[data-section="board"]');
    if (boardLink) {
        boardLink.addEventListener('click', (e) => {
            const targetId = 'board';
            if (e.target.classList.contains('active')) return;

            // Simple active state toggle (since we can't easily modify app.js logic without risk)
            navLinks.forEach(nav => nav.classList.remove('active'));
            boardLink.classList.add('active');

            if (scanner) {
                scanner.classList.remove('scanning');
                void scanner.offsetWidth;
                scanner.classList.add('scanning');
            }

            setTimeout(() => {
                sections.forEach(section => section.classList.remove('active'));
                const boardSection = document.getElementById('board');
                if (boardSection) boardSection.classList.add('active');
            }, 300);
        });
    }

    // Sort Button Event Listeners
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sortButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.getAttribute('data-sort');
            renderPosts();
        });
    });
});
