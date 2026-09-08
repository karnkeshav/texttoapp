/* ── Ready4Launch chat interface ──────────────────────────────────── */

let isStreaming = false;
let isNewConversation = true;
// Track which welcome-card mode the user clicked (null = unset / 'build' / 'convert' / 'chat').
// Sent to the backend on the FIRST message so intent routing is always accurate.
let _welcomeMode = null;
const pendingFiles = new Map(); // fileId → { repoName, files }
let fileIdCounter = 0;
let _userAuthenticated = false; // set by loadUser(); controls welcome card visibility

// ── Multi-Language Dictionary (i18n) ──────────────────────────────
const I18N_APP = {
  en: {
    sidebar_user_loading: "Loading...",
    sidebar_user_guest_title: "Ready4Launch",
    sidebar_user_guest_sub: "Sign in to get started",
    guest_banner_title: "👋 Welcome to Ready4Launch",
    guest_banner_sub: "Sign in with Google to build and deploy apps — free.",
    btn_signin_google: "Sign in with Google",
    sidebar_gh_connected: "GitHub connected",
    sidebar_google_gh_connected: "Google + GitHub connected",
    sidebar_connect_gh_prompt: "Connect GitHub to deploy to Pages",
    connect_gh_banner_title: "🐙 Connect GitHub to build apps",
    connect_gh_banner_sub: "Deploy your apps to GitHub Pages — free, permanent, owned by you.",
    btn_connect_gh: "Connect GitHub",
    btn_connect_gh_account: "Connect GitHub Account",
    setup_guide_link: "📖 Step-by-step setup guide →",
    your_apps: "Your Apps",
    search_repos_placeholder: "Search repos…",
    btn_disconnect: "Disconnect",
    btn_disconnect_gh: "Disconnect GitHub",
    btn_new_conv: "New conversation",
    my_account: "My Account",
    sign_out: "Sign out",
    topbar_sub_default: "Describe your app to get started",
    topbar_sub_pages: "GitHub Pages — deploy to your own repo for free",
    status_ready: "Ready",
    status_thinking: "Thinking…",
    status_building: "Building app…",
    welcome_title: "What do you want to build?",
    welcome_sub: "Describe any app or website in your language. Ready4Launch will ask a few quick questions, then build and deploy your complete website — free.",
    card_build_title: "Build an App",
    card_build_desc: "Turn any idea into a full web app in minutes — just describe it in your language",
    card_convert_title: "Convert a Document",
    card_convert_desc: "Export content to Word, Excel, PowerPoint or PDF instantly",
    card_chat_title: "Chat & Analyse",
    card_chat_desc: "Ask anything, analyse data, research topics or get expert answers",
    card_vision_title: "Analyse an Image",
    card_vision_desc: "Upload any photo or diagram for instant AI visual analysis",
    back_btn: "← Back",
    connect_gh_modal_title: "One last step — connect GitHub",
    connect_gh_modal_desc: "Ready4Launch deploys your app directly to <strong>GitHub Pages</strong> — free, permanent, and owned by you.",
    connect_gh_modal_sub: "Click below to connect your GitHub account in one click.",
    chat_input_placeholder_build: "Describe the app you want to build… (e.g. 'A recipe website with a search bar and dark theme')",
    chat_input_placeholder_convert: "Describe what to create — e.g. 'Make a PowerPoint about our Q1 results' or 'Convert this to a Word doc'",
    chat_input_placeholder_chat: "Ask me anything — a question, analysis, research, or expert advice…",
    chat_input_placeholder_vision: "What would you like to know about the image? (attach it with the 📎 button)",
    chat_input_hint: "Press Enter to send · Shift+Enter for new line",
    btn_deploy_pages: "Deploy to GitHub Pages",
    btn_push_update: "Push update to GitHub",
    btn_preview: "Preview App",
    btn_view_code: "View Code",
    deploy_ready_title: "🚀 Your app is ready to deploy!",
    deploy_ready_desc: "Ready4Launch will create a new public GitHub repository called {repo}, push your code, and enable GitHub Pages — automatically.",
    deploying_status: "Creating repo & deploying…",
    deploy_success_title: "🎉 Deployed to GitHub Pages!",
    deploy_success_desc: "Your code is pushed and GitHub Pages is building the site. The live URL below is usually ready within <strong>2–5 minutes</strong> for a first deployment — if it shows a 404, wait a moment and refresh.",
    live_url_label: "🔗 Live URL:",
    repo_url_label: "📁 Repository:",
    btn_retry_deploy: "Retry deployment",
    gh_session_expired_title: "⚠️ GitHub session expired",
    gh_session_expired_desc: "Please reconnect your GitHub account to deploy.",
    btn_reconnect_gh: "🔗 Reconnect GitHub",
    edit_ready_title: "✅ Changes ready to push!",
    edit_ready_desc: "Ready4Launch has applied your changes to <strong style=\"color:#4ade80;\">{repo}</strong>. Push a new commit to update your live site.",
    pushing_status: "Pushing…",
    push_success_title: "🎉 Update pushed!",
    push_success_desc: "Your changes are live. GitHub Pages usually updates within ~60 seconds.",
    live_site_label: "🔗 Live site:",
    btn_retry_push: "Retry push",
    push_net_error: "⚠️ Network error — please check your connection and retry.",
    edit_welcome_title: "Editing: {repo}",
    edit_welcome_sub: "Describe the changes you want to make. Ready4Launch will fetch the current code, apply your changes, and push a new commit.",
    edit_topbar_prefix: "Editing",
    edit_input_placeholder: "Describe your changes to {repo}…",
    resume_build_title: "🏗️ Unsaved build found — <em>{repo}</em>",
    resume_build_desc: "Your app was built but not deployed. Resume to push it to GitHub Pages.",
    btn_resume_deploy: "🚀 Deploy it",
    btn_resume_dismiss: "Discard",
  },
  hi: {
    sidebar_user_loading: "लोड हो रहा है...",
    sidebar_user_guest_title: "Ready4Launch",
    sidebar_user_guest_sub: "शुरू करने के लिए साइन इन करें",
    guest_banner_title: "👋 Ready4Launch में आपका स्वागत है",
    guest_banner_sub: "ऐप्स बनाने और डिप्लॉय करने के लिए गूगल से साइन इन करें — बिल्कुल मुफ्त।",
    btn_signin_google: "Google से साइन इन करें",
    sidebar_gh_connected: "गिटहब कनेक्टेड है",
    sidebar_google_gh_connected: "गूगल एवं गिटहब कनेक्टेड है",
    sidebar_connect_gh_prompt: "लाइव डिप्लॉय करने के लिए गिटहब कनेक्ट करें",
    connect_gh_banner_title: "🐙 ऐप्स बनाने के लिए गिटहब कनेक्ट करें",
    connect_gh_banner_sub: "अपने ऐप्स को सीधे गिटहब पेजेस पर डिप्लॉय करें — मुफ्त, स्थायी, और आपका अपना।",
    btn_connect_gh: "गिटहब कनेक्ट करें",
    btn_connect_gh_account: "गिटहब खाता कनेक्ट करें",
    setup_guide_link: "📖 स्टेप-बाय-स्टेप गाइड →",
    your_apps: "आपके ऐप्स एवं प्रोजेक्ट्स",
    search_repos_placeholder: "रेपॉजिटरी खोजें…",
    btn_disconnect: "डिस्कनेक्ट",
    btn_disconnect_gh: "गिटहब डिस्कनेक्ट करें",
    btn_new_conv: "नया वार्तालाप",
    my_account: "मेरा खाता",
    sign_out: "साइन आउट",
    topbar_sub_default: "अपने ऐप का विवरण दें और निर्माण शुरू करें",
    topbar_sub_pages: "गिटहब पेजेस — अपनी रेपॉजिटरी में मुफ्त डिप्लॉय करें",
    status_ready: "तैयार",
    status_thinking: "सोच रहा हूँ…",
    status_building: "ऐप बना रहा हूँ…",
    welcome_title: "आप क्या बनाना चाहते हैं?",
    welcome_sub: "अपनी पसंदीदा भाषा में किसी भी ऐप या वेबसाइट का विवरण दें। Ready4Launch आपका सम्पूर्ण वेब ऐप तैयार और डिप्लॉय करेगा — बिल्कुल मुफ्त।",
    card_build_title: "ऐप बनाएं",
    card_build_desc: "किसी भी विचार को कुछ ही मिनटों में पूर्ण वेब ऐप में बदलें — केवल अपनी भाषा में बताएं",
    card_convert_title: "दस्तावेज़ कनवर्ट करें",
    card_convert_desc: "सामग्री को तुरंत Word, Excel, PowerPoint या PDF में निर्यात करें",
    card_chat_title: "बातचीत और विश्लेषण",
    card_chat_desc: "कुछ भी पूछें, डेटा का विश्लेषण करें, शोध करें या विशेषज्ञ सलाह लें",
    card_vision_title: "चित्र का विश्लेषण करें",
    card_vision_desc: "त्वरित AI दृश्य विश्लेषण के लिए कोई भी फोटो या आरेख अपलोड करें",
    back_btn: "← वापस",
    connect_gh_modal_title: "अंतिम चरण — गिटहब कनेक्ट करें",
    connect_gh_modal_desc: "Ready4Launch आपके ऐप को सीधे <strong>GitHub Pages</strong> पर डिप्लॉय करता है — मुफ़्त, स्थायी और आपका अपना।",
    connect_gh_modal_sub: "अपने गिटहब खाते को एक क्लिक में कनेक्ट करने के लिए नीचे क्लिक करें।",
    chat_input_placeholder_build: "जिस ऐप को आप बनाना चाहते हैं उसका विवरण दें… (उदा. 'डार्क थीम वाला इलेक्ट्रॉनिक्स स्टोर')",
    chat_input_placeholder_convert: "क्या बनाना है बताएं — उदा. 'Q1 परिणामों पर एक PowerPoint बनाएं' या 'इसे Word दस्तावेज़ में बदलें'",
    chat_input_placeholder_chat: "मुझसे कुछ भी पूछें — प्रश्न, डेटा विश्लेषण, शोध या विशेषज्ञ सलाह…",
    chat_input_placeholder_vision: "आप चित्र के बारे में क्या जानना चाहते हैं? (📎 बटन से संलग्न करें)",
    chat_input_hint: "भेजने के लिए Enter दबाएं · नई पंक्ति के लिए Shift+Enter",
    btn_deploy_pages: "गिटहब पेजेस पर डिप्लॉय करें",
    btn_push_update: "रेपॉजिटरी में अपडेट पुश करें",
    btn_preview: "लाइव प्रीव्यू देखें",
    btn_view_code: "कोड देखें",
    deploy_ready_title: "🚀 आपका ऐप डिप्लॉय होने के लिए तैयार है!",
    deploy_ready_desc: "Ready4Launch {repo} नाम से एक नया सार्वजनिक गिटहब रेपॉजिटरी बनाएगा, आपका कोड पुश करेगा, और गिटहब पेजेस को स्वतः सक्षम करेगा।",
    deploying_status: "रेपॉजिटरी बना रहा है और डिप्लॉय कर रहा है…",
    deploy_success_title: "🎉 गिटहब पेजेस पर सफलतापूर्वक डिप्लॉय हो गया!",
    deploy_success_desc: "आपका कोड पुश हो गया है और गिटहब पेजेस साइट का निर्माण कर रहा है। पहली बार डिप्लॉयमेंट के लिए लाइव URL आमतौर पर <strong>2–5 मिनट</strong> में तैयार हो जाता है — यदि 404 दिखाई दे, तो थोड़ा प्रतीक्षा करें और रीफ्रेश करें।",
    live_url_label: "🔗 लाइव URL:",
    repo_url_label: "📁 रेपॉजिटरी:",
    btn_retry_deploy: "पुनः डिप्लॉय का प्रयास करें",
    gh_session_expired_title: "⚠️ गिटहब सत्र समाप्त हो गया",
    gh_session_expired_desc: "डिप्लॉय करने के लिए कृपया अपने गिटहब खाते को पुनः कनेक्ट करें।",
    btn_reconnect_gh: "🔗 गिटहब पुनः कनेक्ट करें",
    edit_ready_title: "✅ बदलाव पुश करने के लिए तैयार हैं!",
    edit_ready_desc: "Ready4Launch ने <strong style=\"color:#4ade80;\">{repo}</strong> में आपके बदलाव लागू कर दिए हैं। अपनी लाइव साइट को अपडेट करने के लिए नया कमिट पुश करें।",
    pushing_status: "पुश हो रहा है…",
    push_success_title: "🎉 अपडेट सफलतापूर्वक पुश हो गया!",
    push_success_desc: "आपके बदलाव लाइव हो गए हैं। गिटहब पेजेस आमतौर पर ~60 सेकंड में अपडेट हो जाता है।",
    live_site_label: "🔗 लाइव साइट:",
    btn_retry_push: "पुनः पुश करने का प्रयास करें",
    push_net_error: "⚠️ नेटवर्क त्रुटि — कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
    edit_welcome_title: "संपादित कर रहे हैं: {repo}",
    edit_welcome_sub: "आप जो बदलाव करना चाहते हैं उनका विवरण दें। Ready4Launch वर्तमान कोड प्राप्त करेगा, आपके बदलाव लागू करेगा, और नया कमिट पुश करेगा।",
    edit_topbar_prefix: "संपादन जारी:",
    edit_input_placeholder: "{repo} में किए जाने वाले बदलाव बताएं…",
    resume_build_title: "🏗️ बिना डिप्लॉय किया गया ऐप मिला — <em>{repo}</em>",
    resume_build_desc: "आपका ऐप बन चुका था लेकिन डिप्लॉय नहीं हुआ। इसे गिटहब पेजेस पर पुश करने के लिए पुनः शुरू करें।",
    btn_resume_deploy: "🚀 डिप्लॉय करें",
    btn_resume_dismiss: "हटाएं",
  },
  es: {
    sidebar_user_loading: "Cargando...",
    sidebar_user_guest_title: "Ready4Launch",
    sidebar_user_guest_sub: "Inicia sesión para comenzar",
    guest_banner_title: "👋 Bienvenido a Ready4Launch",
    guest_banner_sub: "Inicia sesión con Google para crear y desplegar aplicaciones gratis.",
    btn_signin_google: "Iniciar sesión con Google",
    sidebar_gh_connected: "GitHub conectado",
    sidebar_google_gh_connected: "Google y GitHub conectados",
    sidebar_connect_gh_prompt: "Conecta GitHub para desplegar en Pages",
    connect_gh_banner_title: "🐙 Conecta GitHub para crear apps",
    connect_gh_banner_sub: "Despliega tus aplicaciones directamente en GitHub Pages: gratis, permanente y tuyo.",
    btn_connect_gh: "Conectar GitHub",
    btn_connect_gh_account: "Conectar Cuenta de GitHub",
    setup_guide_link: "📖 Guía paso a paso →",
    your_apps: "Tus Aplicaciones",
    search_repos_placeholder: "Buscar repositorios…",
    btn_disconnect: "Desconectar",
    btn_disconnect_gh: "Desconectar GitHub",
    btn_new_conv: "Nueva conversación",
    my_account: "Mi Cuenta",
    sign_out: "Cerrar sesión",
    topbar_sub_default: "Describe tu aplicación para comenzar",
    topbar_sub_pages: "GitHub Pages: despliega en tu propio repositorio gratis",
    status_ready: "Listo",
    status_thinking: "Pensando…",
    status_building: "Construyendo app…",
    welcome_title: "¿Qué deseas construir?",
    welcome_sub: "Describe cualquier app o sitio web en tu idioma. Ready4Launch construirá y desplegará tu aplicación web completa gratis.",
    card_build_title: "Construir una App",
    card_build_desc: "Convierte cualquier idea en una aplicación web completa en minutos: solo descríbela en tu idioma",
    card_convert_title: "Convertir Documento",
    card_convert_desc: "Exporta contenido a Word, Excel, PowerPoint o PDF al instante",
    card_chat_title: "Chat y Análisis",
    card_chat_desc: "Pregunta lo que quieras, analiza datos o investiga cualquier tema",
    card_vision_title: "Analizar Imagen",
    card_vision_desc: "Sube cualquier foto o diagrama para análisis visual instantáneo con IA",
    back_btn: "← Volver",
    connect_gh_modal_title: "Un último paso: conectar GitHub",
    connect_gh_modal_desc: "Ready4Launch despliega tu aplicación directamente en <strong>GitHub Pages</strong>: gratis, permanente y tuyo.",
    connect_gh_modal_sub: "Haz clic a continuación para conectar tu cuenta de GitHub con un solo clic.",
    chat_input_placeholder_build: "Describe la aplicación que deseas construir… (ej. 'Una tienda de electrónica con tema oscuro')",
    chat_input_placeholder_convert: "Describe lo que deseas crear, p. ej. 'Crea una presentación de PowerPoint sobre los resultados' o 'Convierte esto a Word'",
    chat_input_placeholder_chat: "Pregúntame lo que sea: una pregunta, análisis, investigación o asesoramiento experto…",
    chat_input_placeholder_vision: "¿Qué te gustaría saber sobre la imagen? (adjúntala con el botón 📎)",
    chat_input_hint: "Presiona Enter para enviar · Shift+Enter para nueva línea",
    btn_deploy_pages: "Desplegar en GitHub Pages",
    btn_push_update: "Publicar actualización en GitHub",
    btn_preview: "Vista previa",
    btn_view_code: "Ver código",
    deploy_ready_title: "🚀 ¡Tu aplicación está lista para desplegarse!",
    deploy_ready_desc: "Ready4Launch creará un nuevo repositorio público de GitHub llamado {repo}, subirá tu código y habilitará GitHub Pages automáticamente.",
    deploying_status: "Creando repositorio y desplegando…",
    deploy_success_title: "🎉 ¡Desplegado en GitHub Pages con éxito!",
    deploy_success_desc: "Tu código ha sido subido y GitHub Pages está construyendo el sitio. La URL en vivo suele estar lista en <strong>2–5 minutos</strong> en el primer despliegue; si muestra un error 404, espera un momento y actualiza.",
    live_url_label: "🔗 URL en vivo:",
    repo_url_label: "📁 Repositorio:",
    btn_retry_deploy: "Reintentar despliegue",
    gh_session_expired_title: "⚠️ La sesión de GitHub ha caducado",
    gh_session_expired_desc: "Por favor reconecta tu cuenta de GitHub para desplegar.",
    btn_reconnect_gh: "🔗 Reconectar GitHub",
    edit_ready_title: "✅ ¡Cambios listos para publicar!",
    edit_ready_desc: "Ready4Launch ha aplicado tus cambios en <strong style=\"color:#4ade80;\">{repo}</strong>. Publica un nuevo commit para actualizar tu sitio en vivo.",
    pushing_status: "Publicando…",
    push_success_title: "🎉 ¡Actualización publicada!",
    push_success_desc: "Tus cambios están en vivo. GitHub Pages normalmente se actualiza en ~60 segundos.",
    live_site_label: "🔗 Sitio en vivo:",
    btn_retry_push: "Reintentar publicación",
    push_net_error: "⚠️ Error de red: verifica tu conexión y vuelve a intentarlo.",
    edit_welcome_title: "Editando: {repo}",
    edit_welcome_sub: "Describe los cambios que deseas realizar. Ready4Launch obtendrá el código actual, aplicará tus cambios y publicará un nuevo commit.",
    edit_topbar_prefix: "Editando",
    edit_input_placeholder: "Describe tus cambios para {repo}…",
    resume_build_title: "🏗️ Compilación no guardada encontrada — <em>{repo}</em>",
    resume_build_desc: "Tu aplicación fue construida pero no desplegada. Continúa para publicarla en GitHub Pages.",
    btn_resume_deploy: "🚀 Desplegar",
    btn_resume_dismiss: "Descartar",
  },
  te: {
    sidebar_user_loading: "లోడ్ అవుతోంది...",
    sidebar_user_guest_title: "Ready4Launch",
    sidebar_user_guest_sub: "ప్రారంభించడానికి సైన్ ఇన్ చేయండి",
    guest_banner_title: "👋 Ready4Launch కి స్వాగతం",
    guest_banner_sub: "యాప్‌లను నిర్మించడానికి మరియు డిప్లాయ్ చేయడానికి Google తో సైన్ ఇన్ చేయండి — ఉచితం.",
    btn_signin_google: "Google తో సైన్ ఇన్ చేయండి",
    sidebar_gh_connected: "GitHub కనెక్ట్ చేయబడింది",
    sidebar_google_gh_connected: "Google + GitHub కనెక్ట్ చేయబడింది",
    sidebar_connect_gh_prompt: "Pages కి డిప్లాయ్ చేయడానికి GitHub కనెక్ట్ చేయండి",
    connect_gh_banner_title: "🐙 యాప్‌లను నిర్మించడానికి GitHub కనెక్ట్ చేయండి",
    connect_gh_banner_sub: "మీ యాప్‌లను GitHub Pages కి డిప్లాయ్ చేయండి — ఉచితం, శాశ్వతం, మీ స్వంతం.",
    btn_connect_gh: "GitHub కనెక్ట్ చేయండి",
    btn_connect_gh_account: "GitHub ఖాతాను కనెక్ట్ చేయండి",
    setup_guide_link: "📖 స్టెప్-బై-స్టెప్ గైడ్ →",
    your_apps: "మీ యాప్‌లు",
    search_repos_placeholder: "రెపోలను శోధించండి…",
    btn_disconnect: "డిస్‌కనెక్ట్",
    btn_disconnect_gh: "GitHub డిస్‌కనెక్ట్ చేయండి",
    btn_new_conv: "కొత్త సంభాషణ",
    my_account: "నా ఖాతా",
    sign_out: "సైన్ అవుట్",
    topbar_sub_default: "ప్రారంభించడానికి మీ యాప్‌ను వివరించండి",
    topbar_sub_pages: "GitHub Pages — మీ స్వంత రెపోకి ఉచితంగా డిప్లాయ్ చేయండి",
    status_ready: "సిద్ధం",
    status_thinking: "ఆలోచిస్తోంది…",
    status_building: "యాప్ నిర్మిస్తోంది…",
    welcome_title: "మీరు ఏమి నిర్మించాలనుకుంటున్నారు?",
    welcome_sub: "మీ భాషలో ఏదైనా యాప్ లేదా వెబ్‌సైట్‌ను వివరించండి. Ready4Launch మీ పూర్తి వెబ్ యాప్‌ను నిర్మించి డిప్లాయ్ చేస్తుంది — ఉచితం.",
    card_build_title: "యాప్ నిర్మించండి",
    card_build_desc: "ఏదైనా ఆలోచనను నిమిషాల్లో పూర్తి వెబ్ యాప్‌గా మార్చండి — మీ భాషలో వివరించండి",
    card_convert_title: "పత్రాన్ని మార్చండి",
    card_convert_desc: "Word, Excel, PowerPoint లేదా PDF కి కంటెంట్‌ను ఎగుమతి చేయండి",
    card_chat_title: "చాట్ & విశ్లేషణ",
    card_chat_desc: "ఏదైనా అడగండి, డేటాను విశ్లేషించండి, సమాచారం పొందండి",
    card_vision_title: "చిత్రాన్ని విశ్లేషించండి",
    card_vision_desc: "తక్షణ విశ్లేషణ కోసం ఏదైనా ఫోటోను అప్‌లోడ్ చేయండి",
    back_btn: "← వెనుకకు",
    connect_gh_modal_title: "చివరి దశ — GitHub కనెక్ట్ చేయండి",
    connect_gh_modal_desc: "Ready4Launch మీ యాప్‌ను నేరుగా <strong>GitHub Pages</strong> కి డిప్లాయ్ చేస్తుంది — ఉచితం, శాశ్వతం, మీ స్వంతం.",
    connect_gh_modal_sub: "మీ GitHub ఖాతాను ఒక క్లిక్‌తో కనెక్ట్ చేయడానికి క్రింద క్లిక్ చేయండి.",
    chat_input_placeholder_build: "మీరు నిర్మించాలనుకుంటున్న యాప్‌ను వివరించండి… (ఉదా. 'డార్క్ థీమ్‌తో ఎలక్ట్రానిక్స్ షాప్')",
    chat_input_placeholder_convert: "ఏమి సృష్టించాలో వివరించండి — ఉదా. 'మా Q1 ఫలితాలపై PowerPoint చేయండి' లేదా 'దీనిని Word డాక్యుమెంట్‌గా మార్చండి'",
    chat_input_placeholder_chat: "నన్ను ఏదైనా అడగండి — ప్రశ్న, విశ్లేషణ, పరిశోధన లేదా నిపుణుల సలహా…",
    chat_input_placeholder_vision: "చిత్రం గురించి మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు? (📎 బటన్‌తో జోడించండి)",
    chat_input_hint: "పంపడానికి Enter నొక్కండి · కొత్త లైన్ కోసం Shift+Enter",
    btn_deploy_pages: "GitHub Pages కి డిప్లాయ్ చేయండి",
    btn_push_update: "GitHub కి అప్‌డేట్ పుష్ చేయండి",
    btn_preview: "యాప్ ప్రివ్యూ",
    btn_view_code: "కోడ్ చూడండి",
    deploy_ready_title: "🚀 మీ యాప్ డిప్లాయ్ చేయడానికి సిద్ధంగా ఉంది!",
    deploy_ready_desc: "Ready4Launch {repo} పేరుతో కొత్త పబ్లిక్ GitHub రిపోజిటరీని సృష్టిస్తుంది, మీ కోడ్‌ను పుష్ చేస్తుంది మరియు GitHub Pages ని ఆటోమేటిక్‌గా ప్రారంభిస్తుంది.",
    deploying_status: "రెపోను సృష్టిస్తోంది & డిప్లాయ్ చేస్తోంది…",
    deploy_success_title: "🎉 GitHub Pages కి విజయవంతంగా డిప్లాయ్ చేయబడింది!",
    deploy_success_desc: "మీ కోడ్ పుష్ చేయబడింది మరియు GitHub Pages సైట్‌ను నిర్మిస్తోంది. మొదటి డిప్లాయ్‌మెంట్ కోసం లైవ్ URL సాధారణంగా <strong>2–5 నిమిషాల్లో</strong> సిద్ధమవుతుంది — 404 కనిపిస్తే, కాసేపు ఆగి రిఫ్రెష్ చేయండి.",
    live_url_label: "🔗 లైవ్ URL:",
    repo_url_label: "📁 రిపోజిటరీ:",
    btn_retry_deploy: "మళ్లీ డిప్లాయ్ చేయడానికి ప్రయత్నించండి",
    gh_session_expired_title: "⚠️ GitHub సెషన్ గడువు ముగిసింది",
    gh_session_expired_desc: "డిప్లాయ్ చేయడానికి దయచేసి మీ GitHub ఖాతాను మళ్లీ కనెక్ట్ చేయండి.",
    btn_reconnect_gh: "🔗 GitHub ని మళ్లీ కనెక్ట్ చేయండి",
    edit_ready_title: "✅ మార్పులు పుష్ చేయడానికి సిద్ధంగా ఉన్నాయి!",
    edit_ready_desc: "Ready4Launch <strong style=\"color:#4ade80;\">{repo}</strong> లో మీ మార్పులను వర్తింపజేసింది. మీ లైవ్ సైట్‌ను అప్‌డేట్ చేయడానికి కొత్త కమిట్ పుష్ చేయండి.",
    pushing_status: "పుష్ చేస్తోంది…",
    push_success_title: "🎉 అప్‌డేట్ విజయవంతంగా పుష్ చేయబడింది!",
    push_success_desc: "మీ మార్పులు లైవ్‌లోకి వచ్చాయి. GitHub Pages సాధారణంగా ~60 సెకన్లలో అప్‌డేట్ అవుతుంది.",
    live_site_label: "🔗 లైవ్ సైట్:",
    btn_retry_push: "మళ్లీ పుష్ చేయడానికి ప్రయత్నించండి",
    push_net_error: "⚠️ నెట్‌వర్క్ లోపం — దయచేసి మీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
    edit_welcome_title: "సవరిస్తోంది: {repo}",
    edit_welcome_sub: "మీరు చేయాలనుకుంటున్న మార్పులను వివరించండి. Ready4Launch ప్రస్తుత కోడ్‌ను తీసుకొని, మీ మార్పులను వర్తింపజేసి, కొత్త కమిట్‌ను పుష్ చేస్తుంది.",
    edit_topbar_prefix: "సవరిస్తోంది",
    edit_input_placeholder: "{repo} లో మీరు చేయాలనుకుంటున్న మార్పులను వివరించండి…",
    resume_build_title: "🏗️ సేవ్ చేయని యాప్ కనుగొనబడింది — <em>{repo}</em>",
    resume_build_desc: "మీ యాప్ నిర్మించబడింది కానీ డిప్లాయ్ కాలేదు. దీన్ని GitHub Pages కి పంపడానికి కొనసాగించండి.",
    btn_resume_deploy: "🚀 డిప్లాయ్ చేయండి",
    btn_resume_dismiss: "తీసివేయి",
  }
};

let currentAppLang = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('r4l_lang') || localStorage.getItem('aios_lang') || 'en';

function t(key, fallback = '') {
  const dict = I18N_APP[currentAppLang] || I18N_APP.en;
  return dict[key] || I18N_APP.en[key] || fallback;
}

function applyAppLanguage(lang) {
  if (!lang) return;
  currentAppLang = lang;
  localStorage.setItem('r4l_lang', lang);
  document.documentElement.lang = lang;

  const dict = I18N_APP[lang] || I18N_APP.en;

  // Translate static DOM elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[k]) {
      el.textContent = dict[k];
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (dict[k]) {
      el.placeholder = dict[k];
    }
  });

  updateWelcomeForMode();
  showWelcomeCards();
  loadUser().catch(() => {});
}

// ── Deploy mode — always GitHub Pages ────────────────────────────
// All deployment goes through GitHub Pages. Cloudflare has been removed.
let deployMode = 'github';

// ── Edit mode state ───────────────────────────────────────────────
let editModeActive = null; // null | { owner, repo }

// ── Attachment state ──────────────────────────────────────────────
// pendingAttachment: null | { fileName, mimeType, data (base64), sizeLabel, isImage }
let pendingAttachment = null;

function openAttachPicker() {
  document.getElementById('attachInput').click();
}

function handleAttachmentSelected(input) {
  const file = input.files[0];
  if (!file) return;

  // 10 MB cap
  if (file.size > 10 * 1024 * 1024) {
    alert('File too large — maximum 10 MB.');
    input.value = '';
    return;
  }

  const isImage = file.type.startsWith('image/');
  const sizeLabel = file.size < 1024
    ? `${file.size} B`
    : file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Strip the data-URI prefix to get raw base64
    const dataUrl = e.target.result;
    const base64  = dataUrl.split(',')[1];

    pendingAttachment = { fileName: file.name, mimeType: file.type, data: base64, sizeLabel, isImage, dataUrl };
    renderAttachPreview();
    document.getElementById('attachBtn').classList.add('has-file');
  };
  reader.readAsDataURL(file);

  // Reset so the same file can be re-selected if removed and re-added
  input.value = '';
}

function renderAttachPreview() {
  if (!pendingAttachment) return;
  const strip = document.getElementById('attachPreviewStrip');
  const inner = document.getElementById('attachPreviewInner');

  const { fileName, sizeLabel, isImage, dataUrl } = pendingAttachment;

  const thumb = isImage
    ? `<img src="${dataUrl}" alt="${escapeHtml(fileName)}" />`
    : `<div class="attach-chip-icon">📄</div>`;

  inner.innerHTML = `
    <div class="attach-chip">
      ${thumb}
      <span class="attach-chip-name" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</span>
      <span class="attach-chip-size">${sizeLabel}</span>
      <button class="attach-chip-remove" onclick="clearAttachment()" title="Remove">✕</button>
    </div>`;

  strip.style.display = 'block';
}

function clearAttachment() {
  pendingAttachment = null;
  const strip = document.getElementById('attachPreviewStrip');
  strip.style.display = 'none';
  document.getElementById('attachPreviewInner').innerHTML = '';
  document.getElementById('attachBtn').classList.remove('has-file');
}

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  applyAppLanguage(currentAppLang);
  await loadUser();
  autoResize(document.getElementById('chatInput'));
  updateWelcomeForMode();

  // Handshake with parent window (if inside an iframe like ai-orchestration)
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'READY4LAUNCH_READY' }, '*');
    }
  } catch (e) {}
});

// ── User profile — never redirects; app is open to all ───────────
async function loadUser() {
  const ghBanner   = document.getElementById('connectGithubBanner');
  const repoSection = document.getElementById('repoSection');
  const subEl      = document.getElementById('userSub');
  const avatarEl   = document.getElementById('userAvatar');
  const nameEl     = document.getElementById('userName');

  try {
    const ghToken = localStorage.getItem('r4l_gh_token') || '';
    const headers = {};
    if (ghToken) headers['x-github-token'] = ghToken;

    const res  = await fetch('/auth/status', { headers, credentials: 'include' });
    const data = await res.json();

    const disconnectBtn = document.getElementById('sidebarDisconnectGhBtn');
    const repoDisconnectBtn = document.getElementById('disconnectGithubBtn');

    if (!data.authenticated && !ghToken) {
      // No session — guest user. Show Google sign-in prompt in sidebar, NOT GitHub connect.
      if (avatarEl) avatarEl.textContent = '⚡';
      if (nameEl)   nameEl.textContent   = 'Ready4Launch';
      if (subEl)    subEl.textContent    = t('sidebar_user_guest_sub');
      if (ghBanner) {
        ghBanner.style.display = 'block';
        ghBanner.innerHTML = `
          <div style="font-size:12px;font-weight:600;color:var(--purple-light);margin-bottom:4px;">${t('guest_banner_title')}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:10px;">${t('guest_banner_sub')}</div>
          <a href="/auth/google" onclick="openOAuth('/auth/google'); return false;" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#fff;text-decoration:none;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:7px;padding:6px 14px;cursor:pointer;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ${t('btn_signin_google')}
          </a>`;
      }
      if (repoSection) repoSection.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (repoDisconnectBtn) repoDisconnectBtn.style.display = 'none';
      showWelcomeCards();
      return;
    }

    const cachedUser = JSON.parse(localStorage.getItem('r4l_user') || '{}');
    const user = data.user || cachedUser;
    const { login, name, avatarUrl, githubLogin } = user;
    const hasGitHub = !!(data.hasGitHub || ghToken || githubLogin);
    const hasGoogle = !!(data.hasGoogle || user?.provider === 'google');

    if (avatarUrl) {
      if (avatarEl) avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${escapeHtml(name || login)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else if (avatarEl) {
      avatarEl.textContent = (name || login || '?')[0].toUpperCase();
    }
    if (nameEl) nameEl.textContent = name || (githubLogin ? `@${githubLogin}` : (login?.startsWith('gh_') ? `@${login.slice(3)}` : login));

    if (hasGitHub) {
      if (subEl)            subEl.textContent       = hasGoogle ? t('sidebar_google_gh_connected') : t('sidebar_gh_connected');
      if (ghBanner)         ghBanner.style.display = 'none';
      if (repoSection)      repoSection.style.display = 'flex';
      if (disconnectBtn)    disconnectBtn.style.display = 'flex';
      if (repoDisconnectBtn) repoDisconnectBtn.style.display = 'inline-block';
      loadUserRepos();
    } else {
      if (subEl)            subEl.textContent       = t('sidebar_connect_gh_prompt');
      if (ghBanner) {
        ghBanner.style.display = 'block';
        ghBanner.innerHTML = `
          <div style="font-size:12px;font-weight:600;color:var(--purple-light);margin-bottom:4px;">${t('connect_gh_banner_title')}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:8px;">${t('connect_gh_banner_sub')}</div>
          <a href="/auth/github" onclick="openOAuth('/auth/github'); return false;" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#fff;text-decoration:none;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:7px;padding:6px 12px;cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            ${t('btn_connect_gh')}
          </a>
          <a href="/github-guide" target="_blank" style="display:block;margin-top:8px;font-size:11px;color:var(--text-3);text-decoration:none;">${t('setup_guide_link')}</a>`;
      }
      if (repoSection)      repoSection.style.display = 'none';
      if (disconnectBtn)    disconnectBtn.style.display = 'none';
      if (repoDisconnectBtn) repoDisconnectBtn.style.display = 'none';
    }

    _userAuthenticated = true;
    showWelcomeCards();

    const pendingBuild = loadPendingBuild();
    if (pendingBuild) showResumeBuildBanner(pendingBuild);

  } catch (err) {
    console.error('loadUser error:', err);
  }
}

// ── Adapt welcome screen copy to deploy mode ──────────────────────
function updateWelcomeForMode() {
  const topbarEl = document.getElementById('topbarSub');
  if (topbarEl) topbarEl.textContent = t('topbar_sub_pages');
}

// ── Prompt bar visibility ────────────────────────────────────────
function hidePromptBar() {
  const bar = document.getElementById('chatInputArea');
  if (bar) bar.style.display = 'none';
}
function showPromptBar() {
  const bar = document.getElementById('chatInputArea');
  if (bar) bar.style.display = '';
}

// ── Welcome mode cards ────────────────────────────────────────────
// Canonical 4-card HTML (used both on first load and after "← Back")
function _welcomeCardsInnerHTML() {
  return `
    <div class="welcome-card" onclick="startWithMode('build')">
      <div class="welcome-card-icon">🏗️</div>
      <div class="welcome-card-title">${t('card_build_title')}</div>
      <div class="welcome-card-desc">${t('card_build_desc')}</div>
    </div>
    <div class="welcome-card" onclick="startWithMode('convert')">
      <div class="welcome-card-icon">📄</div>
      <div class="welcome-card-title">${t('card_convert_title')}</div>
      <div class="welcome-card-desc">${t('card_convert_desc')}</div>
    </div>
    <div class="welcome-card" onclick="startWithMode('chat')">
      <div class="welcome-card-icon">💬</div>
      <div class="welcome-card-title">${t('card_chat_title')}</div>
      <div class="welcome-card-desc">${t('card_chat_desc')}</div>
    </div>
    <div class="welcome-card" onclick="startWithMode('vision')">
      <div class="welcome-card-icon">🖼️</div>
      <div class="welcome-card-title">${t('card_vision_title')}</div>
      <div class="welcome-card-desc">${t('card_vision_desc')}</div>
    </div>`;
}

function showWelcomeCards() {
  const cards = document.getElementById('welcomeCards');
  if (!cards) return;
  const welcomeScreen = document.getElementById('welcomeScreen');
  if (welcomeScreen && welcomeScreen.style.display === 'none') return;
  cards.innerHTML = _welcomeCardsInnerHTML();
  cards.style.display = 'grid';
  hidePromptBar();
}

/**
 * Called when a mode card is tapped.
 * 'build' → check GitHub is connected, then show prompt bar.
 * Others   → reveal prompt bar immediately with an appropriate placeholder.
 */
function startWithMode(mode) {
  // Remember which card the user clicked so we can pass it as a backend hint
  // on the first message (prevents "make me a resume" being routed to build mode).
  _welcomeMode = mode;
  const cards = document.getElementById('welcomeCards');

  if (mode === 'build') {
    // Check if GitHub is connected (deployMode stays 'github' but
    // hasGitHub drives the banner; check if the banner is hidden as proxy)
    const ghBanner = document.getElementById('connectGithubBanner');
    const ghConnected = ghBanner && ghBanner.style.display === 'none';

    if (!ghConnected) {
      // Not connected — show inline connect prompt instead of full redirect
      if (cards) {
        cards.innerHTML = `
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;margin-bottom:2px;">
            <button onclick="showWelcomeCards()" style="background:none;border:none;color:var(--text-3);font-size:13px;cursor:pointer;padding:2px 0;font-family:var(--font);display:flex;align-items:center;gap:4px;">${t('back_btn')}</button>
          </div>
          <div style="grid-column:1/-1;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:16px;padding:28px 24px;text-align:center;">
            <div style="font-size:36px;margin-bottom:14px;">🐙</div>
            <h3 style="font-size:17px;font-weight:700;margin-bottom:10px;">${t('connect_gh_modal_title')}</h3>
            <p style="font-size:14px;color:var(--text-2);margin-bottom:8px;line-height:1.6;">
              ${t('connect_gh_modal_desc')}
            </p>
            <p style="font-size:13px;color:var(--text-3);margin-bottom:20px;">
              ${t('connect_gh_modal_sub')}
              <a href="/github-guide" target="_blank" style="color:var(--purple-light);text-decoration:none;margin-left:6px;">${t('setup_guide_link')}</a>
            </p>
            <button onclick="openOAuth('/auth/github')" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(99,102,241,0.4);font-family:var(--font);">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              ${t('btn_connect_gh_account')}
            </button>
          </div>`;
      }
      return;
    }

    // GitHub connected — go straight to prompt bar
    if (cards) cards.style.display = 'none';
    showPromptBar();
    const input = document.getElementById('chatInput');
    if (input) {
      input.placeholder = t('chat_input_placeholder_build');
      input.value = '';
      input.focus();
      autoResize(input);
    }
    return;
  }

  // Non-build modes — hide cards, show prompt bar
  if (cards) cards.style.display = 'none';
  showPromptBar();

  const placeholders = {
    convert: t('chat_input_placeholder_convert'),
    chat:    t('chat_input_placeholder_chat'),
    vision:  t('chat_input_placeholder_vision'),
  };

  const input = document.getElementById('chatInput');
  if (input) {
    input.placeholder = placeholders[mode] || 'Describe what you want…';
    input.value = '';
    input.focus();
    autoResize(input);
  }

  if (mode === 'vision') openAttachPicker();
}

// ── Resume last build banner ──────────────────────────────────────
// Shown on the welcome screen when an unsaved build is detected in localStorage.
function showResumeBuildBanner({ repoName, files, savedAt }) {
  const welcomeScreen = document.getElementById('welcomeScreen');
  if (!welcomeScreen) return;

  const ageMin = Math.round((Date.now() - savedAt) / 60000);
  const ageStr = ageMin < 60
    ? `${ageMin}m ago`
    : `${Math.round(ageMin / 60)}h ago`;

  const banner = document.createElement('div');
  banner.id = 'resumeBuildBanner';
  banner.style.cssText = `
    margin-top:16px;background:rgba(124,58,237,0.10);
    border:1px solid rgba(124,58,237,0.30);border-radius:12px;
    padding:16px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;`;

  const titleTemplate = t('resume_build_title', '🏗️ Unsaved build found — <em>{repo}</em>').replace('{repo}', escapeHtml(repoName));

  banner.innerHTML = `
    <div style="flex:1;min-width:200px;">
      <div style="font-size:13px;font-weight:700;color:var(--purple-light);margin-bottom:3px;">
        ${titleTemplate}
        <span style="font-weight:400;color:var(--text-3);font-size:12px;margin-left:6px;">${ageStr}</span>
      </div>
      <div style="font-size:12px;color:var(--text-2);">
        ${t('resume_build_desc', 'Your app was built but not deployed. Resume to push it to GitHub Pages.')}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="resumeDeployBtn"
        style="background:var(--grad-main);color:#fff;border:none;border-radius:8px;
               padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);">
        ${t('btn_resume_deploy', '🚀 Deploy it')}
      </button>
      <button id="resumeDismissBtn"
        style="background:none;border:1px solid var(--border);color:var(--text-3);
               border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;font-family:var(--font);">
        ${t('btn_resume_dismiss', 'Discard')}
      </button>
    </div>`;

  welcomeScreen.appendChild(banner);

  banner.querySelector('#resumeDeployBtn').addEventListener('click', () => {
    banner.remove();
    showDeployPrompt(repoName, files);
  });
  banner.querySelector('#resumeDismissBtn').addEventListener('click', () => {
    clearPendingBuild();
    banner.remove();
  });
}

// ── New conversation ─────────────────────────────────────────────
function startNewConversation() {
  isNewConversation = true;
  editModeActive = null;

  const container = document.getElementById('chatMessages');
  container.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <div class="welcome-icon">⚡</div>
      <h2 class="welcome-title">What do you want to build?</h2>
      <p class="welcome-sub">
        Describe any app or website in plain English. Ready4Launch will ask a few quick questions,
        then build and deploy your complete website — free.
      </p>
      <div class="welcome-cards-grid" id="welcomeCards" style="display:none;"></div>
      <div id="editModeBanner" style="display:none;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:10px;padding:12px 16px;font-size:13px;color:var(--purple-light);margin-top:12px;">
        ✏️ <strong>Edit mode</strong> — describe the changes to <span id="editModeBannerRepo"></span>
      </div>
    </div>`;

  // Show cards (and hide prompt bar) for signed-in users
  showWelcomeCards();

  document.getElementById('chatInput').placeholder = 'Describe the app you want to build…';
  document.getElementById('topbarSub').textContent = 'Describe your app to get started';
  closeSidebar();
  setStatus('Ready', false);

  // De-highlight any selected repo in sidebar
  document.querySelectorAll('.repo-item-btn').forEach(b => b.classList.remove('active'));
}

// ── Repo browser ──────────────────────────────────────────────────
let _allRepos = []; // cache for search filtering

async function loadUserRepos() {
  const list = document.getElementById('repoList');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:16px 0;color:var(--text-3);font-size:13px;">Loading…</div>';

  // Clear search box
  const searchEl = document.getElementById('repoSearch');
  if (searchEl) searchEl.value = '';

  try {
    const ghToken = localStorage.getItem('r4l_gh_token') || '';
    const headers = {};
    if (ghToken) headers['x-github-token'] = ghToken;

    const res  = await fetch('/api/github/repos', { headers, credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const repos = await res.json();
    _allRepos = repos; // cache all for filtering

    if (!repos.length) {
      list.innerHTML = '<div style="text-align:center;padding:16px 0;color:var(--text-3);font-size:13px;">No repositories yet.<br>Build your first app!</div>';
      return;
    }

    renderRepoList(repos);
  } catch (err) {
    list.innerHTML = `
      <div style="text-align:center;padding:16px 0;color:var(--text-3);font-size:13px;">
        Could not load repos.<br>
        <button onclick="openOAuth('/auth/github')" style="margin-top:8px;background:var(--surface-2);border:1px solid var(--border);color:var(--purple-light);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;">
          Reconnect GitHub
        </button>
      </div>`;
  }
}

function renderRepoList(repos) {
  const list = document.getElementById('repoList');
  if (!list) return;

  if (!repos.length) {
    list.innerHTML = '<div style="text-align:center;padding:12px 0;color:var(--text-3);font-size:13px;">No repos match.</div>';
    return;
  }

  list.innerHTML = repos.map(r => {
    const [owner, name] = r.fullName.split('/');
    const branch = escapeHtml(r.defaultBranch || 'main');
    return `
      <button class="repo-item-btn"
              data-owner="${escapeHtml(owner)}" data-repo="${escapeHtml(name)}" data-branch="${branch}"
              onclick="selectRepoForEdit('${escapeHtml(owner)}','${escapeHtml(name)}','${branch}')"
              style="width:100%;text-align:left;background:none;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;color:var(--text-2);font-size:13px;display:flex;align-items:center;gap:8px;transition:background 0.15s,color 0.15s;"
              onmouseenter="this.style.background='var(--surface)';this.style.color='var(--text)'"
              onmouseleave="if(!this.classList.contains('active')){this.style.background='none';this.style.color='var(--text-2)'}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:0.6"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(name)}</span>
      </button>`;
  }).join('');
}

function filterRepos(query) {
  if (!_allRepos.length) return;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? _allRepos.filter(r => r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q))
    : _allRepos;
  renderRepoList(filtered);
}

function selectRepoForEdit(owner, repo, defaultBranch) {
  // Reset conversation
  isNewConversation = true;
  editModeActive = { owner, repo, defaultBranch: defaultBranch || 'main' };

  // Update welcome banner
  const container = document.getElementById('chatMessages');
  const titleTemplate = t('edit_welcome_title', 'Editing: {repo}').replace('{repo}', `<span style="color:var(--purple-light);">${escapeHtml(repo)}</span>`);

  // Re-render welcome with edit banner
  container.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <div class="welcome-icon">✏️</div>
      <h2 class="welcome-title" style="font-size:clamp(20px,3vw,28px);">${titleTemplate}</h2>
      <p class="welcome-sub">${t('edit_welcome_sub', 'Describe the changes you want to make. Ready4Launch will fetch the current code, apply your changes, and push a new commit.')}</p>
    </div>`;

  // Update topbar
  document.getElementById('topbarSub').textContent = `${t('edit_topbar_prefix', 'Editing')} ${owner}/${repo}`;

  // Show prompt bar (it was hidden by the welcome card flow)
  showPromptBar();

  // Update input placeholder
  const placeholderTemplate = t('edit_input_placeholder', 'Describe your changes to {repo}…').replace('{repo}', repo);
  document.getElementById('chatInput').placeholder = placeholderTemplate;
  document.getElementById('chatInput').focus();

  // Highlight selected repo in list
  document.querySelectorAll('.repo-item-btn').forEach(b => {
    const isSelected = b.dataset.owner === owner && b.dataset.repo === repo;
    b.classList.toggle('active', isSelected);
    b.style.background = isSelected ? 'var(--surface)' : 'none';
    b.style.color = isSelected ? 'var(--text)' : 'var(--text-2)';
  });

  closeSidebar();
  setStatus(t('status_ready', 'Ready'), false);
}

// ── Sidebar (mobile) ─────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Textarea auto-resize ─────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Sending a message ─────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  // Allow send if there's text OR an attachment (or both)
  if ((!text && !pendingAttachment) || isStreaming) return;

  // Clear welcome screen on first message
  hideWelcome();

  // Show user message (with optional attachment preview)
  appendMessage('user', text, pendingAttachment);
  input.value = '';
  autoResize(input);

  // Snapshot and clear the attachment before the async call
  const attachment = pendingAttachment;
  clearAttachment();

  // Disable input while streaming
  setStreaming(true);

  // Placeholder AI bubble with typing indicator
  const aiMsgId = appendMessage('ai', null);

  try {
    const body = {
      message: text || '(see attached file)',
      newConversation: isNewConversation,
      language: currentAppLang,
    };
    // Pass the welcome-card mode as a hint on the very first message so the backend
    // doesn't have to guess intent from keywords alone (e.g. "make me a resume"
    // should route to conversion, not the app-builder state machine).
    if (isNewConversation && _welcomeMode && _welcomeMode !== 'build') {
      body.modeHint = _welcomeMode;
    }
    _welcomeMode = null; // clear after first use regardless
    if (editModeActive) {
      body.editMode   = true;
      body.editOwner  = editModeActive.owner;
      body.editRepo   = editModeActive.repo;
      body.editBranch = editModeActive.defaultBranch || 'main';
    }
    if (attachment) {
      body.attachment = {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        data:     attachment.data,
      };
    }

    const ghToken = localStorage.getItem('r4l_gh_token') || '';
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ghToken ? { 'x-github-token': ghToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    isNewConversation = false;

    // ── Package gate errors — handle before reading stream ────────
    if (!res.ok) {
      let errData = {};
      try { errData = await res.json(); } catch (_) {}

      if (errData.error === 'not_authenticated') {
        updateAIBubble(aiMsgId, '');
        showSignInWall();
      } else if (errData.error === 'no_package') {
        updateAIBubble(aiMsgId, '');
        showPricingModal();
      } else if (errData.error === 'package_expired') {
        updateAIBubble(aiMsgId,
          `⏰ **${errData.package === 'demo' ? 'Demo expired' : 'Subscription expired'}** — ` +
          `${errData.message} [View plans →](#plans)`
        );
        showPricingModal(errData.message);
      } else if (errData.error === 'daily_limit_reached') {
        updateAIBubble(aiMsgId,
          `🚫 **Daily limit reached** — ${errData.message}`
        );
        showDailyLimitBanner(errData);
      } else {
        updateAIBubble(aiMsgId, '⚠️ Something went wrong. Please try again.');
      }
      return; // stop — finally block handles setStreaming(false) + scrollToBottom
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let aiText = '';
    let buffer = '';

    let finalText = null; // set when 'done' event arrives

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event.type === 'chunk') {
            aiText += event.text;
            updateAIBubble(aiMsgId, aiText);
          } else if (event.type === 'status') {
            setStatus(event.message, true);
          } else if (event.type === 'done') {
            aiText = event.text || aiText;
            updateAIBubble(aiMsgId, aiText);
            // Carry context for post-stream handling
            if (event.editMode) {
              finalText = { text: aiText, editMode: true, editOwner: event.editOwner, editRepo: event.editRepo, editBranch: event.editBranch || 'main' };
            } else if (event.downloadable) {
              finalText = { text: aiText, downloadable: true, detectedFormat: event.detectedFormat || 'docx', pptPurpose: event.pptPurpose || null };
            } else if (event.build) {
              // Backend confirmed this is a build response — carry the pre-parsed repoName
              finalText = { text: aiText, build: true, repoName: event.repoName || null, fallbackSlug: event.fallbackSlug || null };
            } else {
              finalText = aiText;
            }
          } else if (event.type === 'error') {
            updateAIBubble(aiMsgId, `⚠️ ${event.message}`);
          }
        } catch (_) {} // only protects JSON.parse — not checkForCode
      }
    }

    // Post-stream: deploy button / push-update / download options / generated image
    // Fallback: if the 'done' event was never parsed (JSON error on large payload),
    // use the accumulated chunk text so the deploy button still appears.
    if (finalText === null && aiText) finalText = aiText;

    if (finalText !== null) {
      if (finalText && typeof finalText === 'object' && finalText.editMode) {
        showPushUpdatePrompt(finalText.text, finalText.editOwner, finalText.editRepo, finalText.editBranch);
      } else if (finalText && typeof finalText === 'object' && finalText.downloadable) {
        showDownloadOptions(aiMsgId, finalText.text, finalText.detectedFormat, finalText.pptPurpose);
      } else if (finalText && typeof finalText === 'object' && finalText.build) {
        // Backend confirmed build — pass server-side repoName hint to checkForCode
        checkForCode(finalText.text, finalText.repoName, finalText.fallbackSlug);
      } else {
        checkForCode(typeof finalText === 'string' ? finalText : finalText.text || '');
      }
    }
  } catch (err) {
    updateAIBubble(aiMsgId, '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    setStreaming(false);
    setStatus('Ready', false);
    scrollToBottom();
  }
}

// ── UI helpers ────────────────────────────────────────────────────
function hideWelcome() {
  const w = document.getElementById('welcomeScreen');
  if (w) w.remove();
}

let msgCounter = 0;
function appendMessage(role, text, attachment) {
  const id = `msg-${++msgCounter}`;
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.id = id;

  if (role === 'user') {
    // Build optional attachment HTML
    let attachHtml = '';
    if (attachment) {
      if (attachment.isImage) {
        attachHtml = `<div class="msg-attachment"><img src="${attachment.dataUrl}" alt="${escapeHtml(attachment.fileName)}" /></div>`;
      } else {
        attachHtml = `<div class="msg-attachment"><div class="msg-attachment-doc">📄 <span>${escapeHtml(attachment.fileName)}</span> <small style="color:var(--text-3)">${attachment.sizeLabel}</small></div></div>`;
      }
    }
    const textHtml = text ? `<div class="msg-bubble">${escapeHtml(text)}</div>` : '';
    div.innerHTML = `
      <div class="msg-avatar user">👤</div>
      <div class="msg-body">
        <div class="msg-meta">${now}</div>
        ${attachHtml}${textHtml}
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-avatar ai">⚡</div>
      <div class="msg-body">
        <div class="msg-meta">Ready4Launch · ${now}</div>
        <div class="msg-bubble" id="${id}-bubble">
          ${text === null ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : renderMarkdown(text)}
        </div>
      </div>
    `;
  }

  container.appendChild(div);
  scrollToBottom();
  return id;
}

function updateAIBubble(msgId, text) {
  const bubble = document.getElementById(`${msgId}-bubble`);
  if (!bubble) return;
  bubble.innerHTML = renderMarkdown(text);
  scrollToBottom();
}

function scrollToBottom() {
  const c = document.getElementById('chatMessages');
  c.scrollTop = c.scrollHeight;
}

function setStreaming(active) {
  isStreaming = active;
  document.getElementById('sendBtn').disabled = active;
  document.getElementById('chatInput').disabled = active;
}

function setStatus(text, thinking = false) {
  document.getElementById('statusText').textContent = text;
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (thinking ? ' thinking' : '');
}

// ── Code detection & auto-deploy ─────────────────────────────────
// hintRepoName — optional pre-parsed value from the backend done event (more reliable)
// fallbackSlug — slug derived from the user's original request (server-side tertiary fallback)
function checkForCode(text, hintRepoName, fallbackSlug) {
  if (!text) return;

  // Extract REPO_NAME — prefer the server-side hint (more reliable than regex on large text)
  const repoMatch = text.match(/REPO_NAME:\s*([a-z0-9][a-z0-9\-]{1,48}[a-z0-9])/i);
  const repoName  = hintRepoName
    || (repoMatch ? repoMatch[1].toLowerCase() : null)
    || fallbackSlug
    || 'my-app';

  const files = [];

  // ── Multi-file format: each block starts with a FILE: path comment ──
  // Matches ```html, ```css, ```javascript, ```js code blocks
  const BLOCK_RE = /```(html|css|javascript|js)\s*([\s\S]*?)```/gi;
  const FILE_COMMENT_RE = /^(?:<!--\s*FILE:\s*|\/\*\s*FILE:\s*|\/\/\s*FILE:\s*)([^\s*>]+)/i;

  let blockMatch;
  while ((blockMatch = BLOCK_RE.exec(text)) !== null) {
    const lang    = blockMatch[1].toLowerCase();
    const content = blockMatch[2].trim();
    if (!content || content.length < 10) continue;

    const firstLine = content.split('\n')[0];
    const pathMatch = FILE_COMMENT_RE.exec(firstLine);

    if (pathMatch) {
      // Strip the FILE: comment from the body
      const body = content.split('\n').slice(1).join('\n').trim();
      if (body.length >= 10) files.push({ path: pathMatch[1], content: body });
    } else {
      // No FILE: marker — fallback: use default path per language (legacy / single-file AI)
      const defaultPath = lang === 'html' ? 'index.html'
        : lang === 'css'                  ? 'css/style.css'
        :                                   'js/app.js';
      if (!files.find(f => f.path === defaultPath) && content.length >= 50) {
        files.push({ path: defaultPath, content });
      }
    }
  }

  // ── Fallback: truncated response — no closing ```, but HTML present ──
  if (!files.length) {
    const truncatedMatch = text.match(/```html\s*([\s\S]*?<\/html>)/i);
    if (truncatedMatch) {
      const content   = truncatedMatch[1].trim();
      const firstLine = content.split('\n')[0];
      const pathMatch = FILE_COMMENT_RE.exec(firstLine);
      if (pathMatch) {
        files.push({ path: pathMatch[1], content: content.split('\n').slice(1).join('\n').trim() });
      } else {
        files.push({ path: 'index.html', content });
      }
      console.warn('[Ready4Launch] HTML block had no closing ``` — used </html> as boundary');
    }
  }

  if (!files.length) return; // nothing useful to deploy

  showDeployPrompt(repoName, files);
}

// ── Download options card (conversion mode) ──────────────────────
const FORMAT_LABELS = {
  docx: { label: 'Word',        icon: '📝', ext: 'docx' },
  xlsx: { label: 'Excel',       icon: '📊', ext: 'xlsx' },
  pptx: { label: 'PowerPoint',  icon: '📑', ext: 'pptx' },
  pdf:  { label: 'PDF',         icon: '📄', ext: 'pdf'  },
  csv:  { label: 'CSV',         icon: '📋', ext: 'csv'  },
  json: { label: 'JSON',        icon: '🔧', ext: 'json' },
};

function showDownloadOptions(aiMsgId, content, detectedFormat, pptPurpose) {
  const bubble = document.getElementById(`${aiMsgId}-bubble`);
  if (!bubble) return;

  // Build card structure with DOM (never embed content in onclick attributes —
  // JSON.stringify produces double-quoted strings that break HTML attribute parsing)
  const card = document.createElement('div');
  card.className = 'download-card';

  const label = document.createElement('div');
  label.className = 'download-card-label';
  label.textContent = '⬇️ Download as';

  const row = document.createElement('div');
  row.className = 'download-format-row';

  const statusDiv = document.createElement('div');
  statusDiv.className = 'download-card-status';
  statusDiv.id = `dl-status-${aiMsgId}`;

  // Detected format goes first and gets the filled-purple style
  const allFormats = Object.entries(FORMAT_LABELS);
  const ordered = [
    ...allFormats.filter(([k]) => k === detectedFormat),
    ...allFormats.filter(([k]) => k !== detectedFormat),
  ];

  ordered.forEach(([fmt, { label: fmtLabel, icon }]) => {
    const btn = document.createElement('button');
    btn.className = `dl-format-btn${fmt === detectedFormat ? ' dl-format-btn--primary' : ''}`;
    btn.title = `Download as ${fmtLabel}`;
    btn.textContent = `${icon} ${fmtLabel}`;
    // Use addEventListener so the full content string is captured in a closure,
    // never serialised into an HTML attribute where quotes would break parsing.
    btn.addEventListener('click', () => downloadAs(btn, fmt, content, aiMsgId, pptPurpose));
    row.appendChild(btn);
  });

  card.appendChild(label);
  card.appendChild(row);
  card.appendChild(statusDiv);
  bubble.appendChild(card);
  scrollToBottom();
}

// aiMsgId is passed directly from showDownloadOptions — no fragile DOM traversal needed.
async function downloadAs(btn, format, content, aiMsgId, pptPurpose) {
  const statusEl = aiMsgId ? document.getElementById(`dl-status-${aiMsgId}`) : null;

  // Derive a filename from the first Markdown heading, fall back to "document"
  const headingMatch = content.match(/^#+ (.+)$/m);
  const filename = headingMatch
    ? headingMatch[1].replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 60)
    : 'document';

  btn.disabled = true;
  if (statusEl) statusEl.textContent = `Generating ${FORMAT_LABELS[format]?.label || format} file…`;

  try {
    const res = await fetch('/api/convert-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        format,
        filename,
        purposeKey: pptPurpose || undefined,
        userName: document.getElementById('userName')?.textContent?.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (statusEl) {
      statusEl.textContent = `✅ ${FORMAT_LABELS[format]?.label || format} downloaded!`;
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 4000);
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `⚠️ ${err.message}`;
    console.error('[downloadAs]', err);
  } finally {
    btn.disabled = false;
  }
}

// ── Push-update card (edit mode) ─────────────────────────────────
function showPushUpdatePrompt(fullText, owner, repo, branch) {
  // Extract the updated HTML from the AI response
  let htmlContent = null;
  const m = fullText.match(/```html\s*([\s\S]*?)```/i)
         || fullText.match(/```html\s*([\s\S]*?<\/html>)/i);
  if (m) htmlContent = m[1].trim();
  if (!htmlContent || htmlContent.length < 50) {
    // Fallback: show deploy button instead
    checkForCode(fullText);
    return;
  }

  const fileId = `fid-${++fileIdCounter}`;
  pendingFiles.set(fileId, { owner, repo, branch: branch || 'main', files: [{ path: 'index.html', content: htmlContent }] });

  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = 'padding:16px 0;max-width:780px;align-self:flex-start;width:100%;';
  
  const descTemplate = t('edit_ready_desc', 'Ready4Launch has applied your changes to <strong style="color:#4ade80;">{repo}</strong>. Push a new commit to update your live site.');
  const descHtml = descTemplate.replace('{repo}', `${escapeHtml(owner)}/${escapeHtml(repo)}`);

  div.innerHTML = `
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:14px;padding:24px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${t('edit_ready_title', '✅ Changes ready to push!')}</div>
      <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
        ${descHtml}
      </p>
      <button data-fileid="${fileId}" onclick="pushUpdate(this.dataset.fileid, this)"
              style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:var(--font);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
        ${t('btn_push_update', 'Push update to GitHub')}
      </button>
    </div>`;
  container.appendChild(div);
  scrollToBottom();
}

async function pushUpdate(fileId, btn) {
  const pending = pendingFiles.get(fileId);
  if (!pending) return;

  btn.disabled = true;
  btn.innerHTML = `<span style="opacity:0.7">${t('pushing_status', 'Pushing…')}</span>`;

  // Clear any previous error message
  const card = btn.closest('div[style*="border-radius:14px"]');
  const existingErr = card && card.querySelector('.push-error-msg');
  if (existingErr) existingErr.remove();

  try {
    const ghToken = localStorage.getItem('r4l_gh_token') || '';
    const res  = await fetch('/api/github/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ghToken ? { 'x-github-token': ghToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        owner:  pending.owner,
        repo:   pending.repo,
        files:  pending.files,
        branch: pending.branch || 'main',
      }),
    });
    const data = await res.json();

    if (data.success) {
      card.innerHTML = `
        <div class="push-success">
          <h4>${t('push_success_title', '🎉 Update pushed!')}</h4>
          <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
            ${t('push_success_desc', 'Your changes are live. GitHub Pages usually updates within ~60 seconds.')}
          </p>
          <p style="margin-bottom:8px;">
            <strong>${t('live_site_label', '🔗 Live site:')}</strong>
            <a href="${data.pagesUrl}" target="_blank" style="color:var(--purple-light);">${data.pagesUrl}</a>
          </p>
          <p style="margin-bottom:0;">
            <strong>${t('repo_url_label', '📁 Repository:')}</strong>
            <a href="${data.repoUrl}" target="_blank" style="color:var(--purple-light);">${data.repoUrl}</a>
          </p>
        </div>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg> ${t('btn_retry_push', 'Retry push')}`;
      // Show error below the button — btn.closest('p') was null; find the card instead
      const errEl = document.createElement('p');
      errEl.className = 'push-error-msg';
      errEl.style.cssText = 'color:#f87171;font-size:13px;margin-top:10px;margin-bottom:0;';
      errEl.textContent = `⚠️ ${data.error || 'Push failed. Check that the repo still exists and try again.'}`;
      btn.insertAdjacentElement('afterend', errEl);
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg> ${t('btn_retry_push', 'Retry push')}`;
    const errEl = document.createElement('p');
    errEl.className = 'push-error-msg';
    errEl.style.cssText = 'color:#f87171;font-size:13px;margin-top:10px;margin-bottom:0;';
    errEl.textContent = t('push_net_error', '⚠️ Network error — please check your connection and retry.');
    btn.insertAdjacentElement('afterend', errEl);
  }
  scrollToBottom();
}

// ── Unsaved build persistence ─────────────────────────────────────
// Saves the most-recently built (but not-yet-deployed) app to localStorage
// so it survives page reloads and server restarts without re-generating.
const PENDING_BUILD_KEY = 'r4l_pending_build';

function savePendingBuild(repoName, files) {
  try {
    localStorage.setItem(PENDING_BUILD_KEY, JSON.stringify({
      repoName, files, savedAt: Date.now(),
    }));
  } catch (_) {}
}

function clearPendingBuild() {
  try { localStorage.removeItem(PENDING_BUILD_KEY); } catch (_) {}
}

function loadPendingBuild() {
  try {
    const raw = localStorage.getItem(PENDING_BUILD_KEY);
    if (!raw) return null;
    const build = JSON.parse(raw);
    // Discard builds older than 24 hours
    if (!build.repoName || !build.files || Date.now() - build.savedAt > 86_400_000) {
      clearPendingBuild();
      return null;
    }
    return build;
  } catch (_) { return null; }
}

function showDeployPrompt(repoName, files) {
  // Persist so the user doesn't lose their build on refresh / server restart
  savePendingBuild(repoName, files);

  const fileId = `fid-${++fileIdCounter}`;
  pendingFiles.set(fileId, { repoName, files });

  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = 'padding:16px 0;max-width:780px;align-self:flex-start;width:100%;';
  
  const descTemplate = t('deploy_ready_desc', 'Ready4Launch will create a new public GitHub repository called {repo}, push your code, and enable GitHub Pages — automatically.');
  const descHtml = descTemplate.replace('{repo}', `<strong style="color:var(--purple-light);">${escapeHtml(repoName)}</strong>`);

  div.innerHTML = `
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:14px;padding:24px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${t('deploy_ready_title', '🚀 Your app is ready to deploy!')}</div>
      <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
        ${descHtml}
      </p>
      <button data-fileid="${fileId}" onclick="deployToGitHub(this.dataset.fileid, this)"
              style="background:var(--grad-main);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:var(--font);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        ${t('btn_deploy_pages', 'Deploy to GitHub Pages')}
      </button>
    </div>
  `;
  container.appendChild(div);
  scrollToBottom();
}

async function deployToGitHub(fileId, btn) {
  const pending = pendingFiles.get(fileId);
  if (!pending) return;

  btn.disabled = true;
  btn.innerHTML = `<span style="opacity:0.7">${t('deploying_status', 'Creating repo & deploying…')}</span>`;

  const { repoName, files } = pending;

  try {
    const ghToken = localStorage.getItem('r4l_gh_token') || '';
    const res  = await fetch('/api/github/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ghToken ? { 'x-github-token': ghToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ repoName, files, description: `Built with Ready4Launch` }),
    });
    const data = await res.json();
    const card = btn.closest('div[style]');

    if (res.status === 401) {
      // GitHub session expired — prompt reconnect
      card.innerHTML = `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;">
          <p style="margin:0 0 12px;font-weight:600;">${t('gh_session_expired_title', '⚠️ GitHub session expired')}</p>
          <p style="margin:0 0 16px;font-size:14px;color:var(--text-2);">${t('gh_session_expired_desc', 'Please reconnect your GitHub account to deploy.')}</p>
          <a href="/auth/github" style="display:inline-flex;align-items:center;gap:8px;background:var(--grad-main);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
            ${t('btn_reconnect_gh', '🔗 Reconnect GitHub')}
          </a>
        </div>
      `;
      return;
    }

    if (data.success) {
      clearPendingBuild(); // successfully deployed — no need to resume this build later
      card.innerHTML = `
        <div class="push-success">
          <h4>${t('deploy_success_title', '🎉 Deployed to GitHub Pages!')}</h4>
          <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
            ${t('deploy_success_desc', 'Your code is pushed and GitHub Pages is building the site. The live URL below is usually ready within <strong>2–5 minutes</strong> for a first deployment — if it shows a 404, wait a moment and refresh.')}
          </p>
          <p style="margin-bottom:8px;">
            <strong>${t('live_url_label', '🔗 Live URL:')}</strong>
            <a href="${data.pagesUrl}" target="_blank" rel="noopener" style="color:var(--purple-light);">${data.pagesUrl}</a>
          </p>
          <p style="margin-bottom:0;">
            <strong>${t('repo_url_label', '📁 Repository:')}</strong>
            <a href="${data.repoUrl}" target="_blank" rel="noopener" style="color:var(--purple-light);">${data.repoUrl}</a>
          </p>
        </div>
      `;
    } else {
      btn.disabled = false;
      btn.textContent = t('btn_retry_deploy', 'Retry deployment');
      card.querySelector('p').textContent = `Error: ${data.error || 'Deployment failed'}`;
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = t('btn_retry_deploy', 'Retry deployment');
    console.error('[Deploy] GitHub deploy error:', err);
  }
  scrollToBottom();
}

// ── Markdown → HTML (lightweight) ─────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Code blocks — stash with placeholders so bold/italic don't process their content
  const codeBlocks = [];
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // Inline code — stash with placeholders
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(`<code>${code}</code>`);
    return `\x00IC${inlineCodes.length - 1}\x00`;
  });

  // Bold / italic (safe now — code content is protected by placeholders)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Restore inline code, then code blocks
  inlineCodes.forEach((c, i) => { html = html.replace(`\x00IC${i}\x00`, c); });
  codeBlocks.forEach((b, i) => { html = html.replace(`\x00CB${i}\x00`, b); });

  // Numbered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Bullet lists
  html = html.replace(/((?:^[•\-\*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[•\-\*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs (double newlines)
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<(?:h[123]|ul|ol|pre)>)/g, '$1');
  html = html.replace(/(<\/(?:h[123]|ul|ol|pre)>)<\/p>/g, '$1');

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════════════
// Package gate UI — modals & banners
// ══════════════════════════════════════════════════════════════════

function removeModal() {
  document.getElementById('r4l-modal-overlay')?.remove();
}

function showSignInWall() {
  removeModal();

  // Detect whether this is a session expiry (user was signed in this page load)
  // vs a first-time visitor who was never authenticated.
  const sessionExpired = _userAuthenticated;
  const icon    = sessionExpired ? '🔄' : '⚡';
  const heading = sessionExpired ? 'Session expired' : 'Sign in to continue';
  const subtext = sessionExpired
    ? 'Your session has expired — this usually happens after a server restart. Please sign in again to continue.'
    : 'Create a free account to build and deploy apps with Ready4Launch.';
  const btnLabel = sessionExpired ? 'Sign in again with Google' : 'Continue with Google';

  const overlay = document.createElement('div');
  overlay.id = 'r4l-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:20px;padding:40px 36px;max-width:420px;width:100%;text-align:center;">
      <div style="font-size:40px;margin-bottom:16px;">${icon}</div>
      <h2 style="font-size:22px;font-weight:700;margin-bottom:10px;">${heading}</h2>
      <p style="color:var(--text-2);font-size:15px;margin-bottom:28px;">${subtext}</p>
      <a href="/auth/google" style="display:inline-flex;align-items:center;gap:10px;background:#fff;color:#333;border:1px solid #ddd;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;margin-bottom:12px;width:100%;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        ${btnLabel}
      </a>
      <button onclick="removeModal()" style="background:transparent;border:none;color:var(--text-3);font-size:13px;cursor:pointer;margin-top:4px;">Maybe later</button>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) removeModal(); });
  document.body.appendChild(overlay);
}

async function showPricingModal(headline) {
  removeModal();

  // Fetch catalogue from server
  let plans = [];
  try {
    const r = await fetch('/api/user/packages');
    plans = await r.json();
  } catch (_) {}

  const overlay = document.createElement('div');
  overlay.id = 'r4l-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;overflow-y:auto;';

  const cardsHtml = plans.map(p => `
    <div style="flex:1;min-width:220px;background:${p.highlight ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(79,70,229,0.12))' : 'var(--surface-1)'};border:${p.highlight ? '2px solid #6366f1' : '1px solid var(--border)'};border-radius:16px;padding:28px 22px;position:relative;">
      ${p.highlight ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;white-space:nowrap;">MOST POPULAR</div>' : ''}
      <div style="font-size:17px;font-weight:700;margin-bottom:4px;">${escapeHtml(p.name)}</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:16px;">${escapeHtml(p.tagline)}</div>
      <div style="font-size:28px;font-weight:800;margin-bottom:2px;">${escapeHtml(p.price)}</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:20px;">${escapeHtml(p.priceSub)}</div>
      <ul style="list-style:none;padding:0;margin:0 0 24px;font-size:13px;color:var(--text-2);">
        ${p.features.map(f => `<li style="padding:4px 0;">✓ ${escapeHtml(f)}</li>`).join('')}
      </ul>
      <button onclick="activatePackage('${p.id}',this)" style="width:100%;background:${p.highlight ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--surface-2)'};color:${p.highlight ? '#fff' : 'var(--text-1)'};border:${p.highlight ? 'none' : '1px solid var(--border)'};border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);">
        ${escapeHtml(p.cta)}
      </button>
    </div>`).join('');

  overlay.innerHTML = `
    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:24px;padding:40px 32px;max-width:860px;width:100%;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:36px;margin-bottom:12px;">🚀</div>
        <h2 style="font-size:24px;font-weight:800;margin-bottom:8px;">${escapeHtml(headline || 'Choose your Ready4Launch plan')}</h2>
        <p style="color:var(--text-2);font-size:15px;">Build, publish and deploy apps — pick the plan that fits.</p>
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin-bottom:20px;">${cardsHtml}</div>
      <div style="text-align:center;">
        <button onclick="removeModal()" style="background:transparent;border:none;color:var(--text-3);font-size:13px;cursor:pointer;">Maybe later</button>
      </div>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) removeModal(); });
  document.body.appendChild(overlay);
}

async function activatePackage(packageId, btn) {
  btn.disabled = true;
  btn.textContent = 'Activating…';
  try {
    const res  = await fetch('/api/user/package', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ packageType: packageId }),
    });
    const data = await res.json();

    if (res.status === 401) {
      removeModal();
      showSignInWall();
      return;
    }
    if (data.success) {
      removeModal();
      // Show confirmation in chat
      const container = document.getElementById('chatMessages');
      const div = document.createElement('div');
      div.style.cssText = 'padding:16px 0;max-width:780px;align-self:flex-start;width:100%;';
      div.innerHTML = `
        <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:20px;">
          <h4 style="margin:0 0 8px;font-size:16px;">🎉 ${escapeHtml(data.packageName)} activated!</h4>
          <p style="margin:0;font-size:14px;color:var(--text-2);">${escapeHtml(data.message)} You can now start building.</p>
        </div>`;
      container.appendChild(div);
      scrollToBottom();
    } else {
      btn.disabled = false;
      btn.textContent = 'Try again';
    }
  } catch (_) {
    btn.disabled = false;
    btn.textContent = 'Try again';
  }
}

function showDailyLimitBanner(errData) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = 'padding:16px 0;max-width:780px;align-self:flex-start;width:100%;';
  div.innerHTML = `
    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:14px;padding:20px;">
      <p style="margin:0 0 12px;font-weight:600;font-size:15px;">🚫 Daily limit reached for <strong>${escapeHtml(errData.section || 'this section')}</strong></p>
      <p style="margin:0 0 16px;font-size:14px;color:var(--text-2);">
        You've used all <strong>${errData.limit}</strong> free ${escapeHtml(errData.section || '')} prompts for today on the Demo plan.
        Come back tomorrow, or upgrade for more.
      </p>
      <button onclick="showPricingModal('Upgrade to build more today')" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);">
        ⬆️ Upgrade plan
      </button>
    </div>`;
  container.appendChild(div);
  scrollToBottom();
}

// ── OAuth Popup Handling & Multi-Channel Sync ─────────────────────
async function handleAuthSync(payload) {
  if (payload?.githubToken) {
    localStorage.setItem('r4l_gh_token', payload.githubToken);
  }
  if (payload?.user) {
    localStorage.setItem('r4l_user', JSON.stringify(payload.user));
  }

  try {
    const ghToken = payload?.githubToken || localStorage.getItem('r4l_gh_token');
    const u = payload?.user || JSON.parse(localStorage.getItem('r4l_user') || 'null');
    if (ghToken) {
      await fetch('/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-github-token': ghToken },
        credentials: 'include',
        body: JSON.stringify({ githubToken: ghToken, user: u }),
      });
    }
  } catch (e) {
    console.warn('handleAuthSync session sync notice:', e);
  }

  await loadUser();
}

function openOAuth(url) {
  const w = 540, h = 680;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(url, 'OAuthPopup_' + Date.now(), `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`);
  
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    // Popup was blocked — fallback to top level navigation
    if (window.self !== window.top) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
    return null;
  }

  const timer = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(timer);
      setTimeout(async () => {
        const ghToken = localStorage.getItem('r4l_gh_token');
        const user = JSON.parse(localStorage.getItem('r4l_user') || 'null');
        if (ghToken) {
          await handleAuthSync({ githubToken: ghToken, user });
        } else {
          await loadUser();
        }
      }, 500);
    }
  }, 600);

  return popup;
}

// Global click interceptor for OAuth links
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href^="/auth/google"], a[href^="/auth/github"], a[href*="/auth/google"], a[href*="/auth/github"]');
  if (!link) return;

  const isIframe = window.self !== window.top;
  if (isIframe) {
    e.preventDefault();
    openOAuth(link.href);
  }
});

// ── Disconnect GitHub ─────────────────────────────────────────────
async function disconnectGitHub() {
  try {
    // 1. Clear GitHub token and auth payload from localStorage
    localStorage.removeItem('r4l_gh_token');

    const cachedUser = JSON.parse(localStorage.getItem('r4l_user') || '{}');
    delete cachedUser.githubLogin;
    localStorage.setItem('r4l_user', JSON.stringify(cachedUser));

    const authPayload = JSON.parse(localStorage.getItem('r4l_auth_payload') || '{}');
    delete authPayload.githubToken;
    delete authPayload.githubUser;
    if (authPayload.user) delete authPayload.user.githubLogin;
    localStorage.setItem('r4l_auth_payload', JSON.stringify(authPayload));
    localStorage.setItem('r4l_auth_event', JSON.stringify({ time: Date.now(), type: 'AUTH_LOGOUT_GITHUB' }));

    // 2. Call backend to clear GitHub session
    await fetch('/auth/github/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).catch(() => {});

    // 3. Sync session with clearGitHub
    await fetch('/auth/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clearGitHub: true, user: cachedUser }),
    }).catch(() => {});

    // 4. Broadcast to all frames / tabs
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('r4l_auth_channel');
        bc.postMessage({ type: 'AUTH_LOGOUT_GITHUB' });
        bc.close();
      }
    } catch (e) {}

    // 5. Update local state & UI
    _allRepos = [];
    const list = document.getElementById('repoList');
    if (list) list.innerHTML = '';

    await loadUser();
  } catch (err) {
    console.error('Error disconnecting GitHub:', err);
  }
}

// 1. BroadcastChannel listener (instant sync from callback popup or orchestration parent)
try {
  if ('BroadcastChannel' in window) {
    const authChannel = new BroadcastChannel('r4l_auth_channel');
    authChannel.onmessage = function(ev) {
      if (ev.data && (ev.data.type === 'AUTH_COMPLETE' || ev.data === 'AUTH_COMPLETE')) {
        handleAuthSync(ev.data.payload);
      } else if (ev.data && (ev.data.type === 'AUTH_LOGOUT_GITHUB' || ev.data === 'AUTH_LOGOUT_GITHUB')) {
        localStorage.removeItem('r4l_gh_token');
        _allRepos = [];
        loadUser();
      }
    };

    const langChannel = new BroadcastChannel('r4l_lang_channel');
    langChannel.onmessage = function(ev) {
      if (ev.data && (ev.data.type === 'SET_LANGUAGE' || ev.data.lang)) {
        applyAppLanguage(ev.data.lang || ev.data);
      }
    };
  }
} catch(e) {}

// 2. Storage event listener (sync across tabs / iframes)
window.addEventListener('storage', function(e) {
  if (e.key === 'r4l_auth_event' || e.key === 'r4l_auth_payload' || e.key === 'r4l_gh_token') {
    try {
      const data = JSON.parse(localStorage.getItem('r4l_auth_payload') || localStorage.getItem('r4l_auth_event') || '{}');
      if (data?.type === 'AUTH_LOGOUT_GITHUB') {
        localStorage.removeItem('r4l_gh_token');
        _allRepos = [];
        loadUser();
      } else {
        handleAuthSync(data?.payload || data);
      }
    } catch (_) {
      loadUser();
    }
  } else if (e.key === 'r4l_lang' || e.key === 'aios_lang') {
    if (e.newValue) {
      applyAppLanguage(e.newValue);
    }
  }
});

// 3. postMessage listener
window.addEventListener('message', function(event) {
  if (event.data && (event.data.type === 'AUTH_COMPLETE' || event.data === 'AUTH_COMPLETE')) {
    if (event.data.success !== false) {
      handleAuthSync(event.data.payload);
    }
  } else if (event.data && (event.data.type === 'AUTH_LOGOUT_GITHUB' || event.data === 'AUTH_LOGOUT_GITHUB')) {
    localStorage.removeItem('r4l_gh_token');
    _allRepos = [];
    loadUser();
  } else if (event.data && (event.data.type === 'SET_LANGUAGE' || event.data.action === 'SET_LANGUAGE')) {
    applyAppLanguage(event.data.lang);
  }
});
