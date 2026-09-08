/* ── Landing page JS ───────────────────────────────────────────── */

// ── Multi-Language Dictionary (i18n) ──────────────────────────────
const I18N_LANDING = {
  en: {
    nav_features: "Features",
    nav_how_it_works: "How it works",
    nav_packages: "Packages",
    nav_signin: "Sign In",
    hero_badge: "Text-to-App Engine",
    hero_title_1: "Give Your Ideas Wings.",
    hero_title_2: "Build Your Custom App in 60 Seconds.",
    hero_subtitle: "No Code Required. No Developer. No Server.<br />Just type what you want — and watch it come to life.",
    hero_cta: "Sign In with Google to Start Building",
    hero_see_more: "See what others are building ↓",
    hero_trust_1: "✓ No technical skills needed",
    hero_trust_2: "✓ Live app in under 60 seconds",
    hero_trust_3: "✓ Your code, your property, forever",
    cap_tag: "What you can do",
    cap_title: "Four Powerful Capabilities. One Platform.",
    cap_subtitle: "Your AppBuilder account unlocks everything below — analyse, convert, reason, and build — all from plain English conversation.",
    cap_vision_title: "Analyse Images & Documents",
    cap_vision_desc: "Upload any image, PDF, spreadsheet, or report. Ask questions, extract insights, summarise, translate, or describe — instantly.",
    cap_convert_title: "Premium Document Conversion",
    cap_convert_desc: "Generate board-ready reports, professional decks, and structured spreadsheets in seconds. Every document formatted like a consultant prepared it.",
    cap_chat_title: "AI Research & Reasoning",
    cap_chat_desc: "Deep reasoning for complex problems. Solve equations, research topics, draft proposals, analyse case studies — with expert depth.",
    cap_build_title: "Build & Deploy Web Applications",
    cap_build_desc: "The centrepiece. Describe any software in plain English — our Text-to-App Engine designs, codes, and deploys a live, fully functional web application. No developer needed.",
    usecase_tag: "Text-to-App Engine",
    usecase_title: "From Every Discipline. Every Dream.",
    usecase_subtitle: "From the classroom to the boardroom, and across every discipline imaginable — whether you are pursuing a Bachelor of Arts, mastering Medicine, navigating Law, finishing an MBA, engineering the future, or leading an enterprise. If you can imagine it, you can build it.<br /><br />Stop dreaming about the perfect software and start using it. You don't need a developer, a server, or a single line of code. <strong style=\"color:var(--purple-light);\">Just type what you want, and our Text-to-App Engine instantly designs, codes, and deploys a live, fully functional web application.</strong>",
    usecase_heading: "What Will You Bring to Life Today?",
    usecase_corp_title: "Corporate & Operations",
    usecase_corp_desc: "An AGM of a bank tracking regional metrics, or a railway employee streamlining complex shift and cargo schedules.",
    usecase_found_title: "Founders & Agencies",
    usecase_found_desc: "Launch a fully functional SaaS dashboard, a client onboarding portal, or an automated lead-generation tool.",
    usecase_local_title: "Local Business & Services",
    usecase_local_desc: "A plumbing contractor's automated booking system, or a local bakery's live inventory and delivery form.",
    usecase_stud_title: "Students & Educators",
    usecase_stud_desc: "An interactive study vault for your Master's thesis, a custom flashcard app for medical school, or a collaborative workspace for your engineering cohort.",
    usecase_home_title: "Personal & Household",
    usecase_home_desc: "A dedicated home-maker organising family schedules and budgets, or your personal Indo-Chinese recipe hub.",
    usecase_brand_title: "Online Presence",
    usecase_brand_desc: "A photographer's portfolio, a consultant's personal brand site, a startup's waitlist page — live and shareable in under a minute.",
    how_tag: "The Process",
    how_title: "How the Text-to-App Engine Works",
    how_subtitle: "From your idea to a live application — in four steps, under sixty seconds.",
    step1_title: "Sign in with Google",
    step1_desc: "One click creates your private, encrypted workspace. Your builds, your data, accessible only to you — secured by Google.",
    step2_title: "Describe your application",
    step2_desc: "Type what you need in plain English. Our engine asks intelligent follow-up questions to understand exactly what you want to build.",
    step3_title: "The engine builds it",
    step3_desc: "AppBuilder designs the UI, writes the code, handles the logic, and assembles a complete, production-ready web application — automatically.",
    step4_title: "It goes live instantly",
    step4_desc: "Click publish. Your app gets a live URL you can share immediately. Edit it, improve it, rebuild it — as many times as you want.",
    pricing_tag: "Pricing",
    pricing_title: "Choose Your AppBuilder Plan",
    pricing_subtitle: "One-time software purchase. No hidden fees. Own your code forever.",
    promise_title: "The AppBuilder Promise",
    promise_1_title: "Zero Coding",
    promise_1_desc: "You type. We build. No exceptions.",
    promise_2_title: "Instant Live Links",
    promise_2_desc: "Shareable URLs the moment you hit publish.",
    promise_3_title: "Yours to Keep Forever",
    promise_3_desc: "Full source code ownership. No lock-in.",
    promise_4_title: "Premium Documents",
    promise_4_desc: "Word, Excel & PowerPoint that look consultant-made.",
    sec_title: "Your Ideas, Completely Secured",
    sec_desc: "Why do we ask you to sign in? Your generated apps are your intellectual property. We use <strong>Google Authentication</strong> to instantly create a private, encrypted workspace. Your code, your data, and your live links are securely saved and accessible only to you.",
    sec_cta: "⚡ Sign In securely with Google to Start Building",
    sec_note: "Launch your first app today. No credit card required to sign in.",
    footer_text: "Build apps · Analyse anything · Convert documents · Powered by Google Gemini",
    footer_signin: "Sign In with Google",
  },
  hi: {
    nav_features: "विशेषताएँ",
    nav_how_it_works: "यह कैसे काम करता है",
    nav_packages: "पैकेज व मूल्य",
    nav_signin: "साइन इन",
    hero_badge: "टेक्स्ट-टू-ऐप इंजन",
    hero_title_1: "अपने विचारों को पंख दें।",
    hero_title_2: "60 सेकंड में अपना कस्टम ऐप बनाएं।",
    hero_subtitle: "कोडिंग की कोई आवश्यकता नहीं। न डेवलपर, न सर्वर।<br />बस बताएं आप क्या बनाना चाहते हैं — और ऐप को जीवंत होते देखें।",
    hero_cta: "ऐप बनाना शुरू करने के लिए Google से साइन इन करें",
    hero_see_more: "देखें दूसरे क्या बना रहे हैं ↓",
    hero_trust_1: "✓ किसी तकनीकी कौशल की आवश्यकता नहीं",
    hero_trust_2: "✓ 60 सेकंड से कम में लाइव वेब ऐप",
    hero_trust_3: "✓ आपका कोड, आपका स्वामित्व, हमेशा के लिए",
    cap_tag: "आप क्या कर सकते हैं",
    cap_title: "चार शक्तिशाली क्षमताएं। एक मंच।",
    cap_subtitle: "आपका खाता सब कुछ अनलॉक करता है — विश्लेषण, दस्तावेज़ रूपांतरण, शोध और ऐप निर्माण — केवल सरल बातचीत द्वारा।",
    cap_vision_title: "चित्रों और दस्तावेजों का विश्लेषण",
    cap_vision_desc: "कोई भी फोटो, PDF, स्प्रेडशीट या रिपोर्ट अपलोड करें। प्रश्न पूछें, निष्कर्ष निकालें, सारांश बनाएं या अनुवाद करें — तुरंत।",
    cap_convert_title: "प्रीमियम दस्तावेज़ रूपांतरण",
    cap_convert_desc: "बोर्ड-रेडी रिपोर्ट, पेशेवर प्रस्तुतियाँ (PPT), और स्प्रेडशीट सेकंडों में तैयार करें। हर दस्तावेज़ पेशेवर सलाहकार स्तर का।",
    cap_chat_title: "AI अनुसंधान और तर्क क्षमता",
    cap_chat_desc: "जटिल समस्याओं का गहरा विश्लेषण। समीकरण हल करें, शोध करें, प्रस्ताव तैयार करें, केस स्टडीज का विश्लेषण करें।",
    cap_build_title: "वेब ऐप्स बनाएं और डिप्लॉय करें",
    cap_build_desc: "मुख्य आकर्षण। किसी भी सॉफ्टवेयर का अपनी भाषा में विवरण दें — हमारा इंजन एक संपूर्ण कार्यात्मक वेब ऐप डिजाइन, कोड और लाइव डिप्लॉय करेगा।",
    usecase_tag: "टेक्स्ट-टू-ऐप इंजन",
    usecase_title: "हर क्षेत्र के लिए। हर सपने के लिए।",
    usecase_subtitle: "कक्षा से लेकर बोर्डरूम तक — चाहे आप कला, चिकित्सा, कानून, MBA, इंजीनियरिंग या व्यवसाय से जुड़े हों। यदि आप सोच सकते हैं, तो आप बना सकते हैं।<br /><br /><strong style=\"color:var(--purple-light);\">बस अपनी भाषा में टाइप करें, और हमारा टेक्स्ट-टू-ऐप इंजन तुरंत एक लाइव, पूरी तरह से काम करने वाला वेब ऐप बनाएगा।</strong>",
    usecase_heading: "आज आप क्या बनाना चाहेंगे?",
    usecase_corp_title: "कॉर्पोरेट और ऑपरेशंस",
    usecase_corp_desc: "बैंक के क्षेत्रीय मीट्रिक्स ट्रैक करने का डैशबोर्ड, या रेलवे का जटिल शिफ्ट और कार्गो शेड्यूलर।",
    usecase_found_title: "संस्थापक और एजेंसियां",
    usecase_found_desc: "पूर्ण कार्यात्मक SaaS डैशबोर्ड, क्लाइंट ऑनबोर्डिंग पोर्टल, या ऑटोमेटेड लीड जेनरेशन टूल लॉन्च करें।",
    usecase_local_title: "स्थानीय व्यवसाय और सेवाएं",
    usecase_local_desc: "प्लंबिंग ठेकेदार का ऑटोमेटेड बुकिंग सिस्टम, या बेकरी का लाइव इन्वेंटरी और डिलीवरी फॉर्म।",
    usecase_stud_title: "छात्र और शिक्षक",
    usecase_stud_desc: "मास्टर्स थीसिस के लिए इंटरैक्टिव स्टडी वॉल्ट, मेडिकल स्कूल के लिए फ्लैशकार्ड ऐप, या इंजीनियरिंग प्रोजेक्ट।",
    usecase_home_title: "व्यक्तिगत और घरेलू",
    usecase_home_desc: "पारिवारिक बजट और शेड्यूल का प्रबंधन, या अपना व्यक्तिगत रेसिपी हब।",
    usecase_brand_title: "ऑनलाइन उपस्थिति",
    usecase_brand_desc: "फोटोग्राफर का पोर्टफोलियो, सलाहकार की पर्सनल ब्रांड वेबसाइट, या स्टार्टअप का वेटलिस्ट पेज।",
    how_tag: "प्रक्रिया",
    how_title: "टेक्स्ट-टू-ऐप इंजन कैसे काम करता है",
    how_subtitle: "आपके विचार से लाइव एप्लिकेशन तक — केवल 4 चरणों में, 60 सेकंड से कम में।",
    step1_title: "Google से साइन इन करें",
    step1_desc: "एक क्लिक से आपका निजी, एन्क्रिप्टेड कार्यक्षेत्र बनता है। आपका डेटा सुरक्षित और केवल आपके लिए सुलभ।",
    step2_title: "अपने ऐप का विवरण दें",
    step2_desc: "अपनी भाषा में बताएं कि आपको क्या चाहिए। हमारा इंजन सटीक निर्माण के लिए त्वरित प्रश्न पूछता है।",
    step3_title: "इंजन ऐप तैयार करता है",
    step3_desc: "AppBuilder यूआई डिजाइन करता है, कोड लिखता है, लॉजिक संभालता है और प्रोडक्शन-रेडी ऐप बनाता है।",
    step4_title: "तुरंत लाइव हो जाता है",
    step4_desc: "प्रकाशित करें पर क्लिक करें। आपका ऐप लाइव URL पर तुरंत साझा करने के लिए तैयार है।",
    pricing_tag: "मूल्य निर्धारण",
    pricing_title: "अपना AppBuilder प्लान चुनें",
    pricing_subtitle: "एकमुश्त सॉफ्टवेयर खरीद। कोई छिपा हुआ शुल्क नहीं। कोड हमेशा आपका।",
    promise_title: "AppBuilder का वादा",
    promise_1_title: "शून्य कोडिंग",
    promise_1_desc: "आप बताएं। हम बनाएंगे। बिना किसी अपवाद के।",
    promise_2_title: "त्वरित लाइव लिंक",
    promise_2_desc: "पब्लिश करते ही साझा करने योग्य लाइव URL।",
    promise_3_title: "हमेशा के लिए आपका",
    promise_3_desc: "पूर्ण स्रोत कोड का स्वामित्व। कोई लॉक-इन नहीं।",
    promise_4_title: "प्रीमियम दस्तावेज़",
    promise_4_desc: "Word, Excel और PowerPoint जो सलाहकार स्तर के दिखते हैं।",
    sec_title: "आपके विचार, पूरी तरह से सुरक्षित",
    sec_desc: "हम साइन इन करने के लिए क्यों कहते हैं? आपके जेनरेट किए गए ऐप्स आपकी बौद्धिक संपदा हैं। हम एक निजी, एन्क्रिप्टेड वर्कस्पेस बनाने के लिए <strong>Google Authentication</strong> का उपयोग करते हैं। आपका कोड और डेटा केवल आपके लिए सुरक्षित रहता है।",
    sec_cta: "⚡ ऐप बनाना शुरू करने के लिए Google से सुरक्षित रूप से साइन इन करें",
    sec_note: "आज ही अपना पहला ऐप लॉन्च करें। साइन इन के लिए किसी क्रेडिट कार्ड की आवश्यकता नहीं।",
    footer_text: "ऐप्स बनाएं · डेटा विश्लेषण करें · दस्तावेज़ कनवर्ट करें · Google Gemini द्वारा संचालित",
    footer_signin: "Google से साइन इन करें",
  },
  es: {
    nav_features: "Funciones",
    nav_how_it_works: "Cómo funciona",
    nav_packages: "Planes",
    nav_signin: "Iniciar sesión",
    hero_badge: "Motor Texto-a-App",
    hero_title_1: "Da alas a tus ideas.",
    hero_title_2: "Construye tu aplicación en 60 segundos.",
    hero_subtitle: "Sin código. Sin desarrollador. Sin servidor.<br />Solo escribe lo que deseas y míralo cobrar vida.",
    hero_cta: "Inicia sesión con Google para comenzar",
    hero_see_more: "Mira lo que otros construyen ↓",
    hero_trust_1: "✓ Sin conocimientos técnicos",
    hero_trust_2: "✓ App lista en menos de 60 segundos",
    hero_trust_3: "✓ Tu código, tu propiedad, para siempre",
    cap_tag: "Lo que puedes hacer",
    cap_title: "Cuatro capacidades potentes. Una plataforma.",
    cap_subtitle: "Tu cuenta desbloquea todo: análisis, conversión, investigación y construcción de apps desde una conversación simple.",
    cap_vision_title: "Analizar imágenes y documentos",
    cap_vision_desc: "Sube cualquier foto, PDF o reporte. Haz preguntas, extrae datos, resume o traduce al instante.",
    cap_convert_title: "Conversión de documentos premium",
    cap_convert_desc: "Genera presentaciones PPT, reportes Word y hojas Excel en segundos con formato profesional.",
    cap_chat_title: "Investigación y análisis con IA",
    cap_chat_desc: "Razonamiento profundo para problemas complejos. Resuelve ecuaciones, investiga y analiza con nivel experto.",
    cap_build_title: "Crear y desplegar aplicaciones web",
    cap_build_desc: "Describe cualquier software en lenguaje cotidiano: nuestro motor diseña, codifica y despliega una aplicación web real.",
    usecase_tag: "Motor Texto-a-App",
    usecase_title: "Para cada disciplina. Para cada sueño.",
    usecase_subtitle: "Desde el aula hasta la sala de juntas. Si puedes imaginarlo, puedes construirlo.<br /><br /><strong style=\"color:var(--purple-light);\">Solo escribe lo que deseas y nuestro motor creará una aplicación web completa al instante.</strong>",
    usecase_heading: "¿Qué vas a crear hoy?",
    usecase_corp_title: "Corporativo y Operaciones",
    usecase_corp_desc: "Panel de métricas bancarias o programación de turnos ferroviarios.",
    usecase_found_title: "Fundadores y Agencias",
    usecase_found_desc: "Lanza paneles SaaS y portales de clientes interactivos.",
    usecase_local_title: "Negocios Locales y Servicios",
    usecase_local_desc: "Sistema de reservas de fontanería o formularios de panadería.",
    usecase_stud_title: "Estudiantes y Educadores",
    usecase_stud_desc: "Bóveda de estudio interactiva, app de flashcards o portal de proyectos.",
    usecase_home_title: "Personal y Hogar",
    usecase_home_desc: "Organizador de presupuestos familiares o tu recetario personal.",
    usecase_brand_title: "Presencia Online",
    usecase_brand_desc: "Portafolio de fotografía o sitio web de marca personal.",
    how_tag: "El proceso",
    how_title: "Cómo funciona el motor Texto-a-App",
    how_subtitle: "De tu idea a una aplicación web en cuatro pasos, en menos de sesenta segundos.",
    step1_title: "Inicia sesión con Google",
    step1_desc: "Un clic crea tu espacio de trabajo privado y encriptado, protegido por Google.",
    step2_title: "Describe tu aplicación",
    step2_desc: "Escribe lo que necesitas en tu idioma. El motor hace preguntas clave para entender tu visión.",
    step3_title: "El motor la construye",
    step3_desc: "AppBuilder diseña la interfaz, escribe el código y ensambla la aplicación completa.",
    step4_title: "Se publica al instante",
    step4_desc: "Haz clic en publicar para obtener un enlace funcional y compartible de inmediato.",
    pricing_tag: "Precios",
    pricing_title: "Elige tu plan AppBuilder",
    pricing_subtitle: "Compra de software de pago único. Sin cargos ocultos. Tu código para siempre.",
    promise_title: "La promesa de AppBuilder",
    promise_1_title: "Cero código",
    promise_1_desc: "Tú escribes. Nosotros construimos. Sin excepciones.",
    promise_2_title: "Enlaces en vivo al instante",
    promise_2_desc: "URLs compartibles en cuanto publicas.",
    promise_3_title: "Tuyo para siempre",
    promise_3_desc: "Propiedad total del código fuente.",
    promise_4_title: "Documentos premium",
    promise_4_desc: "Word, Excel y PowerPoint con formato de alta calidad.",
    sec_title: "Tus ideas, completamente seguras",
    sec_desc: "¿Por qué pedimos iniciar sesión? Tus aplicaciones son tu propiedad intelectual. Utilizamos <strong>Autenticación de Google</strong> para crear instantáneamente un espacio de trabajo privado y cifrado. Tu código y datos están protegidos y solo tú puedes acceder a ellos.",
    sec_cta: "⚡ Inicia sesión de forma segura con Google para comenzar",
    sec_note: "Lanza tu primera app hoy. No se requiere tarjeta de crédito.",
    footer_text: "Crea apps · Analiza datos · Convierte documentos · Desarrollado con Google Gemini",
    footer_signin: "Iniciar sesión con Google",
  },
  te: {
    nav_features: "ఫీచర్లు",
    nav_how_it_works: "ఇది ఎలా పనిచేస్తుంది",
    nav_packages: "ప్లాన్లు & ధరలు",
    nav_signin: "సైన్ ఇన్",
    hero_badge: "టెక్స్ట్-టు-యాప్ ఇంజిన్",
    hero_title_1: "మీ ఆలోచనలకు రెక్కలు ఇవ్వండి.",
    hero_title_2: "60 సెకన్లలో మీ కస్టమ్ యాప్‌ను నిర్మించండి.",
    hero_subtitle: "కోడింగ్ అవసరం లేదు. డెవలపర్ లేదా సర్వర్ అవసరం లేదు.<br />మీకు కావలసినదాన్ని వివరించండి — యాప్ వెంటనే సిద్ధమవుతుంది.",
    hero_cta: "నిర్మించడం ప్రారంభించడానికి Google తో సైన్ ఇన్ చేయండి",
    hero_see_more: "ఇతరులు ఏమి నిర్మిస్తున్నారో చూడండి ↓",
    hero_trust_1: "✓ సాంకేతిక నైపుణ్యాలు అవసరం లేదు",
    hero_trust_2: "✓ 60 సెకన్లలోపు ప్రత్యక్ష యాప్",
    hero_trust_3: "✓ మీ కోడ్, మీ స్వంతం, ఎప్పటికీ",
    cap_tag: "మీరు ఏమి చేయవచ్చు",
    cap_title: "నాలుగు శక్తివంతమైన సామర్థ్యాలు. ఒక వేదిక.",
    cap_subtitle: "మీ ఖాతా అన్నింటినీ అన్‌లాక్ చేస్తుంది — విశ్లేషణ, పత్రాల మార్పిడి, పరిశోధన మరియు యాప్ నిర్మాణం.",
    cap_vision_title: "చిత్రాలు & పత్రాల విశ్లేషణ",
    cap_vision_desc: "ఏదైనా ఫోటో, PDF లేదా నివేదికను అప్‌లోడ్ చేయండి. ప్రశ్నలు అడగండి, సారాంశాలు పొందండి — తక్షణమే.",
    cap_convert_title: "ప్రీమియం డాక్యుమెంట్ మార్పిడి",
    cap_convert_desc: "PowerPoint, Word మరియు Excel ఫార్మాట్లలో నివేదికలను సెకన్లలో సృష్టించండి.",
    cap_chat_title: "AI పరిశోధన & విశ్లేషణ",
    cap_chat_desc: "సమస్యల లోతైన విశ్లేషణ. గణితం, పరిశోధన మరియు వ్యూహాత్మక ప్రణాళికలు రూపొందించండి.",
    cap_build_title: "వెబ్ యాప్‌లను నిర్మించండి & డిప్లాయ్ చేయండి",
    cap_build_desc: "ఏదైనా సాఫ్ట్‌వేర్‌ను వివరించండి — మా ఇంజిన్ పూర్తి వెబ్ యాప్‌ను కోడ్ చేసి లైవ్ డిప్లాయ్ చేస్తుంది.",
    usecase_tag: "టెక్స్ట్-టు-యాప్ ఇంజిన్",
    usecase_title: "ప్రతి విభాగం కోసం. ప్రతి కల కోసం.",
    usecase_subtitle: "తరగతి గది నుండి బోర్డ్‌రూమ్ వరకు. మీరు ఊహించగలిగితే, మీరు నిర్మించగలరు.<br /><br /><strong style=\"color:var(--purple-light);\">మీకు కావలసినదాన్ని టైప్ చేయండి, మా ఇంజిన్ తక్షణమే పూర్తి వెబ్ యాప్‌ను నిర్మిస్తుంది.</strong>",
    usecase_heading: "ఈరోజు మీరు ఏమి సృష్టిస్తారు?",
    usecase_corp_title: "కార్పొరేట్ & కార్యకలాపాలు",
    usecase_corp_desc: "బ్యాంక్ మెట్రిక్స్ డ్యాష్‌బోర్డ్ లేదా రైల్వే షెడ్యూలింగ్ వ్యవస్థలు.",
    usecase_found_title: "వ్యవస్థాపకులు & ఏజెన్సీలు",
    usecase_found_desc: "SaaS డ్యాష్‌బోర్డులు మరియు క్లయింట్ పోర్టల్‌లను ప్రారంభించండి.",
    usecase_local_title: "స్థానిక వ్యాపారాలు & సేవలు",
    usecase_local_desc: "ఆటోమేటెడ్ బుకింగ్ సిస్టమ్ లేదా బేకరీ ఆర్డర్ ఫారమ్‌లు.",
    usecase_stud_title: "విద్యార్థులు & అధ్యాపకులు",
    usecase_stud_desc: "స్టడీ వాల్ట్, ఫ్లాష్‌కార్డ్ యాప్ లేదా ఇంజనీరింగ్ ప్రాజెక్ట్ పోర్టల్.",
    usecase_home_title: "వ్యక్తిగత & గృహ వినియోగం",
    usecase_home_desc: "కుటుంబ బడ్జెట్ లేదా మీ వ్యక్తిగత వంటకాల కేంద్రం.",
    usecase_brand_title: "ఆన్‌లైన్ ఉనికి",
    usecase_brand_desc: "ఫోటోగ్రాఫర్ పోర్ట్‌ఫోలియో లేదా స్టార్టప్ వెయిట్‌లిస్ట్ పేజీ.",
    how_tag: "ప్రక్రియ",
    how_title: "టెక్స్ట్-టు-యాప్ ఇంజిన్ ఎలా పనిచేస్తుంది",
    how_subtitle: "మీ ఆలోచన నుండి లైవ్ అప్లికేషన్ వరకు — నాలుగు దశల్లో, అరవై సెకన్లలో.",
    step1_title: "Google తో సైన్ ఇన్ చేయండి",
    step1_desc: "ఒక క్లిక్‌తో మీ ప్రైవేట్ మరియు ఎన్‌క్రిప్ట్ చేసిన వర్క్‌స్పేస్ సిద్ధమవుతుంది.",
    step2_title: "మీ యాప్‌ను వివరించండి",
    step2_desc: "మీ భాషలో మీకు ఏమి కావాలో టైప్ చేయండి.",
    step3_title: "ఇంజిన్ నిర్మిస్తుంది",
    step3_desc: "UI డిజైన్ చేసి, కోడ్ రాసి పూర్తి వెబ్ యాప్‌ను అసెంబుల్ చేస్తుంది.",
    step4_title: "తక్షణమే లైవ్ అవుతుంది",
    step4_desc: "పబ్లిష్ పై క్లిక్ చేయండి. భాగస్వామ్యం చేయడానికి లైవ్ URL సిద్ధం.",
    pricing_tag: "ధరలు",
    pricing_title: "మీ AppBuilder ప్లాన్‌ను ఎంచుకోండి",
    pricing_subtitle: "వన్-టైమ్ సాఫ్ట్‌వేర్ కొనుగోలు. మీ కోడ్ ఎప్పటికీ మీదే.",
    promise_title: "AppBuilder వాగ్దానం",
    promise_1_title: "సున్నా కోడింగ్",
    promise_1_desc: "మీరు టైప్ చేయండి. మేము నిర్మిస్తాము.",
    promise_2_title: "తక్షణ లైవ్ లింకులు",
    promise_2_desc: "పబ్లిష్ చేసిన వెంటనే లింక్ సిద్ధం.",
    promise_3_title: "ఎప్పటికీ మీదే",
    promise_3_desc: "పూర్తి సోర్స్ కోడ్ యాజమాన్యం.",
    promise_4_title: "ప్రీమియం పత్రాలు",
    promise_4_desc: "అత్యుత్తమ నాణ్యతతో Word, Excel & PowerPoint.",
    sec_title: "మీ ఆలోచనలు, సంపూర్ణంగా సురక్షితం",
    sec_desc: "మేము సైన్ ఇన్ ఎందుకు అడుగుతున్నాము? మీ యాప్‌లు మీ మేధో సంపత్తి. ప్రైవేట్, ఎన్‌క్రిప్టెడ్ వర్క్‌స్పేస్‌ను రూపొందించడానికి మేము <strong>Google Authentication</strong> ను ఉపయోగిస్తాము. మీ కోడ్ మరియు డేటా సురక్షితంగా సేవ్ చేయబడతాయి మరియు మీకు మాత్రమే అందుబాటులో ఉంటాయి.",
    sec_cta: "⚡ ప్రారంభించడానికి Google తో సురక్షితంగా సైన్ ఇన్ చేయండి",
    sec_note: "ఈరోజే మీ మొదటి యాప్‌ను ప్రారంభించండి. క్రెడిట్ కార్డ్ అవసరం లేదు.",
    footer_text: "యాప్‌లు నిర్మించండి · విశ్లేషించండి · పత్రాలు మార్చండి · Google Gemini శక్తితో",
    footer_signin: "Google తో సైన్ ఇన్ చేయండి",
  }
};

let currentLandingLang = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('r4l_lang') || localStorage.getItem('aios_lang') || 'en';

function applyLandingLanguage(lang) {
  if (!lang) return;
  currentLandingLang = lang;
  localStorage.setItem('r4l_lang', lang);
  document.documentElement.lang = lang;

  const dict = I18N_LANDING[lang] || I18N_LANDING.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[k]) {
      if (dict[k].includes('<')) {
        el.innerHTML = dict[k];
      } else {
        el.textContent = dict[k];
      }
    }
  });
}

// Language listeners
try {
  if ('BroadcastChannel' in window) {
    const langChannel = new BroadcastChannel('r4l_lang_channel');
    langChannel.onmessage = function(ev) {
      if (ev.data && (ev.data.type === 'SET_LANGUAGE' || ev.data.lang)) {
        applyLandingLanguage(ev.data.lang || ev.data);
      }
    };
  }
} catch(e) {}

window.addEventListener('message', function(event) {
  if (event.data && (event.data.type === 'SET_LANGUAGE' || event.data.action === 'SET_LANGUAGE')) {
    applyLandingLanguage(event.data.lang);
  }
});

window.addEventListener('storage', function(e) {
  if ((e.key === 'r4l_lang' || e.key === 'aios_lang') && e.newValue) {
    applyLandingLanguage(e.newValue);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  applyLandingLanguage(currentLandingLang);
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'READY4LAUNCH_READY' }, '*');
    }
  } catch (e) {}
});

// ── Particle canvas ──────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#7c3aed', '#3b82f6', '#06b6d4', '#a78bfa'];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Demo typing animation ────────────────────────────────────────
(function initDemoTyping() {
  const cursor = document.getElementById('typingCursor');
  const aiMsg  = document.getElementById('demoAiMsg');
  const aiBubble = document.getElementById('demoAiBubble');
  if (!cursor) return;

  // Each entry: [user prompt, AI reply, delay before showing AI reply]
  const demos = [
    {
      user: 'Build a bank branch performance dashboard for our AGM meeting — regions, metrics, and a red/amber/green status.',
      ai:   'Excellent! A few quick questions:\n1. How many regions? (e.g. North, South, East, West)\n2. Key metrics — NPA ratio, CASA, advances, or custom?\n3. Should the dashboard auto-calculate RAG status?\n\nI\'ll build and deploy your live dashboard now. 🚀',
    },
    {
      user: 'Create a booking system for my plumbing business — slots, customer details, and an SMS confirmation.',
      ai:   'Building your booking system now! Setting up:\n• Time-slot calendar with availability\n• Customer form (name, address, job type)\n• Confirmation page with booking ID\n• Export to your daily schedule\n\nLive link ready in seconds ⚡',
    },
    {
      user: 'Write my Q3 board report and convert it to a McKinsey-style PowerPoint, a Word document, and an Excel summary.',
      ai:   'Creating all three premium formats now:\n📑 PowerPoint — story-arc slides, consultant layout\n📝 Word — board-ready with proper headings\n📊 Excel — structured data with regional breakdowns\n\nDownload buttons ready below.',
    },
    {
      user: 'Build me a flashcard app for my MBBS pharmacology exam — spaced repetition, progress tracking.',
      ai:   'Perfect study tool incoming! Building:\n• Flashcard flip interface (drug → mechanism → side effects)\n• Spaced repetition algorithm\n• Progress tracker by subject\n• Quiz mode with score history\n\nYour live study app is ready 🎓',
    },
  ];

  let demoIdx = 0;
  let charIdx  = 0;
  let phase    = 'user'; // 'user' | 'wait' | 'ai' | 'pause'
  let currentText = '';

  function typeNext() {
    const demo = demos[demoIdx];

    if (phase === 'user') {
      const target = demo.user;
      if (charIdx < target.length) {
        currentText += target[charIdx++];
        cursor.textContent = currentText;
        setTimeout(typeNext, 22);
      } else {
        phase = 'wait';
        charIdx = 0;
        currentText = '';
        setTimeout(typeNext, 700);
      }

    } else if (phase === 'wait') {
      if (aiMsg) aiMsg.style.display = '';
      if (aiBubble) aiBubble.textContent = '';
      phase = 'ai';
      setTimeout(typeNext, 100);

    } else if (phase === 'ai') {
      const target = demo.ai;
      if (charIdx < target.length) {
        currentText += target[charIdx++];
        if (aiBubble) aiBubble.textContent = currentText;
        setTimeout(typeNext, 16);
      } else {
        phase = 'pause';
        setTimeout(typeNext, 3800);
      }

    } else if (phase === 'pause') {
      // Reset for next demo
      demoIdx = (demoIdx + 1) % demos.length;
      charIdx  = 0;
      currentText = '';
      phase = 'user';
      cursor.textContent = '';
      if (aiMsg) aiMsg.style.display = 'none';
      if (aiBubble) aiBubble.textContent = '';
      setTimeout(typeNext, 500);
    }
  }

  setTimeout(typeNext, 1400);
})();

// ── Nav scroll effect ────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  nav.style.background = window.scrollY > 20
    ? 'rgba(8,9,14,0.95)'
    : 'rgba(8,9,14,0.8)';
});

// ── Mobile nav ───────────────────────────────────────────────────
function toggleMobileMenu() {
  const actions = document.querySelector('.nav-actions');
  if (!actions) return;
  const isOpen = actions.style.display === 'flex';
  actions.style.cssText = isOpen
    ? ''
    : 'display:flex;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:rgba(8,9,14,0.98);padding:20px;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08);z-index:99;';
}

// ── Setup accordion ──────────────────────────────────────────────
function toggleStep(n) {
  const step = document.querySelector(`.setup-step[data-step="${n}"]`);
  if (!step) return;
  const isOpen = step.classList.contains('open');
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('open'));
  if (!isOpen) step.classList.add('open');
}

// Open first step by default
window.addEventListener('DOMContentLoaded', () => {
  toggleStep(1);
  checkAuthStatus();
});

// ── Tab switching in setup ───────────────────────────────────────
function switchTab(btn, tabId) {
  const parent = btn.closest('.setup-step-body');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ── Checklist ────────────────────────────────────────────────────
function updateChecklist() {
  const checkboxes = document.querySelectorAll('.check-item input[type="checkbox"]');
  const allChecked = Array.from(checkboxes).every(c => c.checked);
  const readySection = document.getElementById('readySection');
  if (readySection) readySection.style.display = allChecked ? 'block' : 'none';
}

// ── Scroll to GitHub setup guide ─────────────────────────────────
function scrollToGuide() {
  const guide = document.getElementById('github-setup-guide');
  if (!guide) return;
  guide.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Auto-open Step 1 so the user can start reading immediately
  const firstStep = guide.querySelector('.setup-step[data-step="1"]');
  if (firstStep && !firstStep.classList.contains('open')) firstStep.classList.add('open');
}

// ── Auth status ──────────────────────────────────────────────────
// If the visitor already has a GitHub session, replace the "Connect GitHub"
// landing-page buttons with a direct "Open app" link.
async function checkAuthStatus() {
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    if (data.authenticated) {
      const openAppHTML  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Open AppBuilder →`;
      const openAppStyle = 'background:linear-gradient(135deg,#10b981,#059669) !important;color:#fff !important;border-color:transparent !important;';
      // Replace all sign-in links with "Open app"
      document.querySelectorAll('a[href="/auth/google"], a[href="/auth/github"]').forEach(btn => {
        btn.href = '/app';
        btn.innerHTML = openAppHTML;
        btn.style.cssText += openAppStyle;
      });
    }
  } catch (_) {}
}

// ── OAuth Popup Handling & Multi-Channel Sync ─────────────────────
function openOAuth(url) {
  const w = 540, h = 680;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(url, 'OAuthPopup_' + Date.now(), `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`);
  
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
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
      setTimeout(() => {
        checkAuthStatus();
      }, 500);
    }
  }, 600);

  return popup;
}

// ── Start building ───────────────────────────────────────────────
function startBuilding() {
  const isIframe = window.self !== window.top;
  if (isIframe) {
    openOAuth('/auth/google');
  } else {
    window.location.href = '/auth/google';
  }
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

// 1. BroadcastChannel listener (instant sync from callback popup)
try {
  if ('BroadcastChannel' in window) {
    const authChannel = new BroadcastChannel('r4l_auth_channel');
    authChannel.onmessage = function(ev) {
      if (ev.data && (ev.data.type === 'AUTH_COMPLETE' || ev.data === 'AUTH_COMPLETE')) {
        window.location.href = ev.data.target || '/app';
      }
    };
  }
} catch(e) {}

// 2. Storage event listener (sync across tabs / iframes)
window.addEventListener('storage', function(e) {
  if (e.key === 'r4l_auth_event') {
    window.location.href = '/app';
  }
});

// 3. postMessage listener
window.addEventListener('message', function(event) {
  if (event.data && (event.data.type === 'AUTH_COMPLETE' || event.data === 'AUTH_COMPLETE')) {
    if (event.data.success !== false) {
      window.location.href = event.data.target || '/app';
    }
  }
});

// ── Intersection observer for entrance animations ─────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.step-card, .cap-card, .feature-card, .setup-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
