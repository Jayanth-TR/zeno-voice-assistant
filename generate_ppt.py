import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path):
    prs = Presentation()
    # Set 16:9 Widescreen (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank slide layout

    # Palette
    C_BG = RGBColor(248, 250, 252)        # #F8FAFC
    C_WHITE = RGBColor(255, 255, 255)
    C_NAVY = RGBColor(15, 23, 42)          # #0F172A
    C_ORANGE = RGBColor(255, 87, 34)       # #FF5722
    C_ORANGE_LIGHT = RGBColor(255, 237, 213) # #FFEDD5
    C_PURPLE = RGBColor(124, 58, 237)      # #7C3AED
    C_GREEN = RGBColor(37, 211, 102)       # #25D366
    C_SLATE_DARK = RGBColor(30, 41, 59)    # #1E293B
    C_SLATE_MUTED = RGBColor(100, 116, 139) # #64748B
    C_BOX_BG = RGBColor(241, 245, 249)     # #F1F5F9
    C_BOX_BORDER = RGBColor(203, 213, 225) # #CBD5E1

    def add_header(slide, step_num, title, category="USER FLOW STEP"):
        # Top brand bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_NAVY
        top_bar.line.fill.background()

        # Step tag badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.22), Inches(2.2), Inches(0.32))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_ORANGE
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        p_b = tf_b.paragraphs[0]
        p_b.text = f"{category} • STEP {step_num}" if step_num else category
        p_b.font.size = Pt(11)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE
        p_b.alignment = PP_ALIGN.CENTER

        # Title text
        tx = slide.shapes.add_textbox(Inches(0.8), Inches(0.55), Inches(9.5), Inches(0.5))
        tf = tx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = C_WHITE

        # Branding right side
        brand_tx = slide.shapes.add_textbox(Inches(10.0), Inches(0.35), Inches(2.5), Inches(0.5))
        tf_brand = brand_tx.text_frame
        p_br = tf_brand.paragraphs[0]
        p_br.text = "ZENO AI AMBASSADOR"
        p_br.font.size = Pt(12)
        p_br.font.bold = True
        p_br.font.color.rgb = C_ORANGE
        p_br.alignment = PP_ALIGN.RIGHT
        p_br_sub = tf_brand.add_paragraph()
        p_br_sub.text = "Netcore Experience Center"
        p_br_sub.font.size = Pt(9.5)
        p_br_sub.font.color.rgb = RGBColor(148, 163, 184)
        p_br_sub.alignment = PP_ALIGN.RIGHT

    def add_photo_placeholder(slide, title="SCREENSHOT PLACEHOLDER", subtitle="Paste photo here (Portrait / HoloBox)", x=7.4, y=1.45, w=5.1, h=5.6):
        # Outer Card
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        box.fill.solid()
        box.fill.fore_color.rgb = C_BOX_BG
        box.line.color.rgb = C_BOX_BORDER
        box.line.width = Pt(2)

        # Center camera badge
        icon_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + (w - 2.8)/2), Inches(y + h/2 - 0.9), Inches(2.8), Inches(0.5))
        icon_box.fill.solid()
        icon_box.fill.fore_color.rgb = C_WHITE
        icon_box.line.color.rgb = C_ORANGE
        icon_box.line.width = Pt(1.5)
        tf_i = icon_box.text_frame
        p_i = tf_i.paragraphs[0]
        p_i.text = "📷 ADD PHOTO HERE"
        p_i.font.size = Pt(12)
        p_i.font.bold = True
        p_i.font.color.rgb = C_ORANGE
        p_i.alignment = PP_ALIGN.CENTER

        # Placeholder label text below
        tx = slide.shapes.add_textbox(Inches(x + 0.3), Inches(y + h/2 - 0.25), Inches(w - 0.6), Inches(1.5))
        tf = tx.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = C_SLATE_DARK
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(11)
        p2.font.color.rgb = C_SLATE_MUTED
        p2.alignment = PP_ALIGN.CENTER

        p3 = tf.add_paragraph()
        p3.text = "Aspect Ratio: ~9:16 Portrait (HoloBox screen capture)"
        p3.font.size = Pt(9.5)
        p3.font.italic = True
        p3.font.color.rgb = RGBColor(148, 163, 184)
        p3.alignment = PP_ALIGN.CENTER

    def add_content_card(slide, title, items, callout=None, callout_type="info", x=0.8, y=1.45, w=6.2, h=5.6):
        # Card container
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        card.fill.solid()
        card.fill.fore_color.rgb = C_WHITE
        card.line.color.rgb = RGBColor(226, 232, 240)
        card.line.width = Pt(1.5)

        tx = slide.shapes.add_textbox(Inches(x + 0.4), Inches(y + 0.35), Inches(w - 0.8), Inches(h - 0.7))
        tf = tx.text_frame
        tf.word_wrap = True

        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = C_SLATE_DARK
        p_title.space_after = Pt(14)

        for heading, body in items:
            p_item = tf.add_paragraph()
            p_item.text = f"•  {heading}: "
            p_item.font.size = Pt(12)
            p_item.font.bold = True
            p_item.font.color.rgb = C_ORANGE
            p_item.space_after = Pt(4)

            run = p_item.add_run()
            run.text = body
            run.font.bold = False
            run.font.color.rgb = C_SLATE_DARK

        if callout:
            tf.add_paragraph().space_after = Pt(8)
            p_c = tf.add_paragraph()
            p_c.text = f"💡 Key UX Insight: {callout}"
            p_c.font.size = Pt(11)
            p_c.font.bold = True
            p_c.font.color.rgb = C_PURPLE if callout_type == "purple" else C_ORANGE

    # =========================================================================
    # SLIDE 1: Title & Flow Overview
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_NAVY
    bg1.line.fill.background()

    # Pill badge
    b1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(3.4), Inches(0.42))
    b1.fill.solid()
    b1.fill.fore_color.rgb = C_ORANGE
    b1.line.fill.background()
    p1 = b1.text_frame.paragraphs[0]
    p1.text = "NETCORE EXPERIENCE CENTER"
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.alignment = PP_ALIGN.CENTER

    # Main title
    t1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.6), Inches(11), Inches(2.2))
    tf1 = t1.text_frame
    tf1.word_wrap = True
    p1_1 = tf1.paragraphs[0]
    p1_1.text = "ZENO - AI Event Ambassador"
    p1_1.font.size = Pt(44)
    p1_1.font.bold = True
    p1_1.font.color.rgb = C_WHITE
    p1_2 = tf1.add_paragraph()
    p1_2.text = "Complete Step-by-Step User Experience Flow"
    p1_2.font.size = Pt(24)
    p1_2.font.color.rgb = RGBColor(226, 232, 240)
    p1_3 = tf1.add_paragraph()
    p1_3.text = "Interactive Holographic Experience (HoloBox 9:16 Portrait)"
    p1_3.font.size = Pt(14)
    p1_3.font.color.rgb = C_ORANGE

    # Roadmap steps card
    flow_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(4.3), Inches(10.933), Inches(2.4))
    flow_box.fill.solid()
    flow_box.fill.fore_color.rgb = RGBColor(30, 41, 59)
    flow_box.line.color.rgb = RGBColor(51, 65, 85)
    flow_box.line.width = Pt(1.5)

    tf_fb = flow_box.text_frame
    tf_fb.word_wrap = True
    p_fb0 = tf_fb.paragraphs[0]
    p_fb0.text = "INTERACTIVE USER JOURNEY MAP"
    p_fb0.font.size = Pt(13)
    p_fb0.font.bold = True
    p_fb0.font.color.rgb = C_ORANGE
    p_fb0.space_after = Pt(10)

    steps_overview = [
        "1. Start Screen", "2. Industry Selection", "3. Welcome Message",
        "4. Select Challenge", "5. Select Question", "6. Zeno Thinking",
        "7. Two-Point Response", "8. Follow-Up Questions", "9. Connect With Us"
    ]
    p_fb1 = tf_fb.add_paragraph()
    p_fb1.text = "  ➜  ".join(steps_overview[:5])
    p_fb1.font.size = Pt(13)
    p_fb1.font.bold = True
    p_fb1.font.color.rgb = C_WHITE
    p_fb1.space_after = Pt(8)

    p_fb2 = tf_fb.add_paragraph()
    p_fb2.text = "  ➜  ".join(steps_overview[5:])
    p_fb2.font.size = Pt(13)
    p_fb2.font.bold = True
    p_fb2.font.color.rgb = C_ORANGE_LIGHT

    # =========================================================================
    # SLIDE 2: Step 1 - User Clicks Start
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, 1, "User Clicks 'Start' (Idle Kiosk State)")
    add_content_card(
        s2,
        "Step 1: Initiation from Kiosk Idle State",
        [
            ("User Action", "Visitor approaches the HoloBox display and taps the prominent 'Start' button at the bottom right."),
            ("Avatar State", "Zeno is in Idle loop animation with playful eye blinking, inviting attendees to engage."),
            ("UI Elements", "Branded header 'ZENO - NETCORE AI AMBASSADOR', pulsing orange 'Start' pill near feet, ambient floor shadow."),
            ("Session Bootstrap", "WebSocket handshakes with FastAPI backend; audio channels and live session context are primed.")
        ],
        callout="Tapping 'Start' opens the domain drawer without overwhelming the user.",
        callout_type="orange"
    )
    add_photo_placeholder(s2, "HoloBox Idle / Start Screen", "Insert photo of HoloBox showing 3D Zeno in Idle state with the pulsing 'Start' button.")

    # =========================================================================
    # SLIDE 3: Step 2 - Selects Industry
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, 2, "User Selects Industry Domain")
    add_content_card(
        s3,
        "Step 2: Experience Center Industry Domain Selection",
        [
            ("User Action", "Visitor taps their industry from the interactive modal (e.g., Banking & Fintech, E-Commerce, Insurance)."),
            ("Personalization Engine", "Zeno instantly switches domain context, knowledge benchmark data, and case study metrics."),
            ("Default Industry", "'Banking & Fintech' is pre-highlighted; user can easily switch to E-Commerce or Insurance."),
            ("Visual Transition", "Zeno prepares custom greeting audio, and the side challenge container pre-loads relevant pain points.")
        ],
        callout="Contextual tailoring ensures SME visitors see numbers relevant to their exact business model.",
        callout_type="purple"
    )
    add_photo_placeholder(s3, "Industry Selection Modal", "Insert photo of Industry Selector showing Banking, E-Commerce, and other domain tiles.")

    # =========================================================================
    # SLIDE 4: Step 3 - Welcome Message
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, 3, "Personalized Welcome Message & Greeting Audio")
    add_content_card(
        s4,
        "Step 3: Zeno Welcomes the Attendee",
        [
            ("System Behavior", "Zeno begins speaking an industry-specific greeting (e.g. Banking ROI & funnel challenges)."),
            ("Avatar State", "Zeno transitions to Speaking animation with animated gestures and friendly smile."),
            ("Live Status Pill", "Status pill below Zeno's feet displays 'Welcoming you...' with pulsing blue indicator."),
            ("Audio Pacing", "High-fidelity TTS audio streams in sync; avatar moves smoothly to accommodate the side drawer.")
        ],
        callout="Audio greeting creates immediate engagement without requiring any reading yet.",
        callout_type="orange"
    )
    add_photo_placeholder(s4, "Zeno Greeting / Welcome State", "Insert photo of Zeno actively speaking the welcome message with the 'Welcoming you...' status pill.")

    # =========================================================================
    # SLIDE 5: Step 4 - Selects Challenge
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, 4, "User Selects Business Challenge")
    add_content_card(
        s5,
        "Step 4: Browsing Industry Business Challenges",
        [
            ("Side Container", "On the right side of Zeno, the Experience Center challenge stack reveals 3 curated pain points."),
            ("Challenge 1", "'Customers check FD rates but don't book' (High drop-off in rate calculator)."),
            ("Challenge 2", "'Too many journeys, no idea which ones leak' (Cross-channel analytics gap)."),
            ("Challenge 3", "'Customers go quiet and you find out late' (Dormancy / churn warning)."),
            ("User Action", "Attendee taps Challenge 1 to explore that specific SME bottleneck.")
        ],
        callout="Real SME dilemmas replace generic corporate jargon.",
        callout_type="orange"
    )
    add_photo_placeholder(s5, "Select Business Challenge Container", "Insert photo of the right-side container displaying the 3 challenge cards.")

    # =========================================================================
    # SLIDE 6: Step 5 - Selects Primary Question
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, 5, "User Selects / Taps Primary Question")
    add_content_card(
        s6,
        "Step 5: Tapping the Primary Question",
        [
            ("Active Card", "The container transitions to active challenge view: 'Customers check FD rates but don't book'."),
            ("Primary Question", "Attendee taps: 'Why do customers check FD rates twice and drop off?' (with 'Ask Zeno →' hint)."),
            ("Micro-Interaction", "The card responds with active border elevation and immediate audio queue feedback."),
            ("Voice Alternative", "Visitor can also tap the central mic button and simply speak the question naturally.")
        ],
        callout="One-tap query dispatch eliminates typing or complex menu navigation.",
        callout_type="purple"
    )
    add_photo_placeholder(s6, "Primary Question Card", "Insert photo showing the focused challenge and the primary question card with 'Ask Zeno →'.")

    # =========================================================================
    # SLIDE 7: Step 6 - Zeno Thinking State
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, 6, "Zeno Thinking State (Fast Benchmark Retrieval)")
    add_content_card(
        s7,
        "Step 6: Real-Time Reasoning & RAG Retrieval",
        [
            ("Avatar Animation", "Zeno transitions to the contemplative 'Thinking' animation (hand near chin, focused gaze)."),
            ("Head Badge", "A purple pill badge appears near Zeno's head: '● Zeno is thinking...' with breathing pulse animation."),
            ("Dynamic Status Pill", "Bottom status pill reflects real-time RAG stage: '● Reading 3 cart-recovery journeys' or '● Analyzing FD leak points'."),
            ("Zero Disruption", "Thinking indicators strictly unmount as soon as response points start speaking.")
        ],
        callout="Transparent status pills give visitors visible feedback while AI generates multi-step insights.",
        callout_type="purple"
    )
    add_photo_placeholder(s7, "Zeno Thinking State", "Insert photo of Zeno in thinking pose with the purple 'Zeno is thinking...' badge near head.")

    # =========================================================================
    # SLIDE 8: Step 7 - Zeno Response (Two-Point Pagination)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, 7, "Zeno Response & Two-Point Pagination on Left")
    add_content_card(
        s8,
        "Step 7: Structured Voice + Bullet Response Delivery",
        [
            ("Strict Left Alignment", "Response points appear strictly on the left side of Zeno, positioned 4px higher for optimal eye level."),
            ("Two Points at a Time", "First 2 bullet points are displayed while Zeno speaks them. Older thinking badge is completely hidden."),
            ("Seamless Pagination", "When speech reaches point 3, points 3 & 4 seamlessly replace points 1 & 2 in the exact same spot."),
            ("Interactive Dots", "Subtle dot indicators (● ○) appear beneath points allowing visitors to tap between pages after audio finishes.")
        ],
        callout="Showing only 2 bullet points prevents screen clutter and matches attendee reading speed.",
        callout_type="orange"
    )
    add_photo_placeholder(s8, "Left Response Points & Talking Avatar", "Insert photo showing the 2 response bullet points on the left with Zeno speaking.")

    # =========================================================================
    # SLIDE 9: Step 8 - Follow-Up Questions
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, 8, "Dynamic Follow-Up Questions Revealed")
    add_content_card(
        s9,
        "Step 8: Conversational Continuity via Follow-Ups",
        [
            ("Smart Follow-Ups", "After Zeno completes the primary answer, 2-3 tailored follow-up question bubbles appear on the right."),
            ("Sample Follow-Up", "'How does automated WhatsApp nudging compare to SMS for rate drop-offs?'"),
            ("Continuous Dialogue", "Visitor taps any follow-up to continue the investigation seamlessly."),
            ("Voice Freedom", "Alternatively, visitor presses the central mic button to ask any spontaneous question.")
        ],
        callout="Pre-computed follow-ups guide non-technical executives deeper into solution architecture.",
        callout_type="purple"
    )
    add_photo_placeholder(s9, "Follow-Up Questions Stack", "Insert photo showing suggested follow-up cards appearing on the right panel.")

    # =========================================================================
    # SLIDE 10: Step 9 - Lead Capture & Connect with Us
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, 9, "Lead Conversion: 'Connect with Us' WhatsApp QR")
    add_content_card(
        s10,
        "Step 9: Seamless Enterprise Lead Capture",
        [
            ("Clean CTA Button", "A prominent WhatsApp green button labeled 'Connect with Us →' sits directly under challenges and follow-ups."),
            ("User Action", "Visitor taps 'Connect with Us →' to receive the case study & benchmark data on their own phone."),
            ("WhatsApp QR Modal", "Full-screen modal renders dynamic WhatsApp QR code with pre-filled message including industry & challenge name."),
            ("Instant Connection", "Scanning the QR opens WhatsApp directly to Netcore enterprise SME consultants.")
        ],
        callout="Zero typing required on kiosk: visitors take the conversation directly into their personal WhatsApp.",
        callout_type="orange"
    )
    add_photo_placeholder(s10, "Connect with Us QR Modal", "Insert photo of the WhatsApp QR lead capture modal with pre-filled industry context.")

    # =========================================================================
    # SLIDE 11: Step 10 - Centralized Voice & Conversation Controls
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, 10, "Voice Interaction & Session Controls")
    add_content_card(
        s11,
        "Step 10: Natural Voice Loop & Graceful Exit",
        [
            ("Centered Controls", "Mic button (36px) and 'End Conversation' pill are centered directly above the status pill."),
            ("Voice Activity Detection (VAD)", "Real-time speech recognition with live audio waveform and transcript caption dock."),
            ("Speech Interruption", "Visitor can tap pause (⏸) on the mic button at any time to interrupt Zeno's speech."),
            ("Graceful Dismissal", "Tapping 'End Conversation' triggers Zeno's '👋 Goodbye!' wave animation, audio chime, and resets to idle.")
        ],
        callout="Vertical hierarchy (Caption -> Controls -> Status Pill) ensures zero collision across all screen states.",
        callout_type="purple"
    )
    add_photo_placeholder(s11, "Voice Controls & Session End", "Insert photo of centered Mic button, End Conversation pill, and status badge.")

    # Save presentation
    prs.save(output_path)
    print(f"Successfully generated PowerPoint presentation at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Zeno_User_Flow_Guide.pptx")
    create_deck(out_file)
