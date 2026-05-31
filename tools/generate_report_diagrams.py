from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path("report_assets")
OUT_DIR.mkdir(exist_ok=True)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


FONT_TITLE = font(38, True)
FONT_H = font(24, True)
FONT_B = font(19)
FONT_SMALL = font(16)


def wrap_text(draw, text, max_width, fnt):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        test = (line + " " + word).strip()
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def rounded_box(draw, xy, title, body, fill, outline="#334155"):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=18, fill=fill, outline=outline, width=3)
    draw.text((x1 + 22, y1 + 18), title, fill="#0f172a", font=FONT_H)
    y = y1 + 58
    for line in wrap_text(draw, body, x2 - x1 - 44, FONT_B):
        draw.text((x1 + 22, y), line, fill="#1f2937", font=FONT_B)
        y += 25


def arrow(draw, start, end, color="#2563eb", width=5):
    draw.line([start, end], fill=color, width=width)
    sx, sy = start
    ex, ey = end
    if abs(ex - sx) >= abs(ey - sy):
        direction = 1 if ex > sx else -1
        points = [(ex, ey), (ex - 18 * direction, ey - 10), (ex - 18 * direction, ey + 10)]
    else:
        direction = 1 if ey > sy else -1
        points = [(ex, ey), (ex - 10, ey - 18 * direction), (ex + 10, ey - 18 * direction)]
    draw.polygon(points, fill=color)


def label(draw, xy, text, fill="#475569"):
    draw.text(xy, text, fill=fill, font=FONT_SMALL)


def architecture_diagram():
    img = Image.new("RGB", (1800, 1100), "#ffffff")
    d = ImageDraw.Draw(img)
    d.text((70, 45), "IIITL Mess Portal - System Architecture", fill="#0f172a", font=FONT_TITLE)
    d.line((70, 105, 1730, 105), fill="#cbd5e1", width=3)

    boxes = {
        "student": (80, 190, 420, 360, "Student Browser", "React UI for menu, AI meal selection, payment, QR code and ratings", "#e0f2fe"),
        "admin": (80, 520, 420, 690, "Admin Browser", "Admin panel for menu, timings, meal count, QR scan and reminders", "#dcfce7"),
        "frontend": (570, 335, 960, 525, "React Frontend", "Routes and components for buy meals, schedule, QR code, scan QR, admin panel and history", "#fef9c3"),
        "backend": (1110, 335, 1500, 525, "Node.js + Express API", "Authentication, business logic, payment verification, AI route, mail and schedulers", "#ede9fe"),
        "mongo": (1120, 720, 1485, 875, "MongoDB", "Users, buyers, orders, menu, timings, ratings and reminder logs", "#dcfce7"),
        "google": (1530, 175, 1740, 295, "Google OAuth", "Login", "#fee2e2"),
        "razor": (1530, 345, 1740, 465, "Razorpay", "Payment", "#ffedd5"),
        "gemini": (1530, 515, 1740, 635, "Gemini API", "Diet-based meal selection", "#e0e7ff"),
        "smtp": (1530, 685, 1740, 805, "SMTP Mail", "Reminder emails", "#fce7f3"),
        "scheduler": (1110, 110, 1500, 250, "Scheduled Services", "Sunday reminders and Monday weekly meal rollover", "#f1f5f9"),
    }

    for data in boxes.values():
        rounded_box(d, data[:4], data[4], data[5], data[6])

    arrow(d, (420, 275), (570, 400))
    arrow(d, (420, 605), (570, 465))
    label(d, (450, 310), "HTTPS requests")
    label(d, (445, 580), "Admin actions")

    arrow(d, (960, 430), (1110, 430))
    label(d, (990, 395), "REST API")
    arrow(d, (1300, 525), (1300, 720))
    label(d, (1320, 620), "Mongoose")

    arrow(d, (1500, 405), (1530, 405))
    arrow(d, (1500, 575), (1530, 575))
    arrow(d, (1500, 745), (1530, 745))
    arrow(d, (1500, 235), (1530, 235))

    arrow(d, (1305, 250), (1305, 335))
    label(d, (1320, 285), "timed jobs")

    d.rounded_rectangle((80, 935, 1740, 1030), radius=16, fill="#f8fafc", outline="#cbd5e1", width=2)
    d.text((110, 958), "Main outcome:", fill="#0f172a", font=FONT_H)
    d.text((290, 962), "Students pay for selected meals. Mess gets advance meal-wise headcount, reducing wastage, shortage and overcrowding.", fill="#1f2937", font=FONT_B)

    img.save(OUT_DIR / "architecture_diagram.png", quality=95)


def lifecycle_diagram():
    img = Image.new("RGB", (1800, 1200), "#ffffff")
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Weekly Meal Booking Lifecycle", fill="#0f172a", font=FONT_TITLE)
    d.line((70, 105, 1730, 105), fill="#cbd5e1", width=3)

    steps = [
        ((90, 175, 430, 340), "1. View Menu", "Student checks weekly menu and meal timings.", "#e0f2fe"),
        ((545, 175, 885, 340), "2. AI Suggestion", "Gemini selects meals based on diet preference, e.g. avoid fried items.", "#e0e7ff"),
        ((1000, 175, 1340, 340), "3. Review Selection", "Student can change the auto-selected meals before payment.", "#fef9c3"),
        ((1360, 175, 1700, 340), "4. Pay Online", "Razorpay verifies payment and saves next-week meals.", "#ffedd5"),
        ((1360, 500, 1700, 665), "5. Reminder", "Sunday reminder is sent to users who have not bought meals.", "#fce7f3"),
        ((1000, 500, 1340, 665), "6. Rollover", "Monday midnight moves next-week meals into current-week meals.", "#ede9fe"),
        ((545, 500, 885, 665), "7. QR Verification", "At mess entry, QR data validates the active meal and prevents reuse.", "#dcfce7"),
        ((90, 500, 430, 665), "8. Meal Counts", "Admin sees meal-wise demand and actual consumption.", "#f1f5f9"),
    ]
    for xy, title, body, fill in steps:
        rounded_box(d, xy, title, body, fill)

    arrow(d, (430, 255), (545, 255))
    arrow(d, (885, 255), (1000, 255))
    arrow(d, (1340, 255), (1360, 255))
    arrow(d, (1530, 340), (1530, 500))
    arrow(d, (1360, 582), (1340, 582))
    arrow(d, (1000, 582), (885, 582))
    arrow(d, (545, 582), (430, 582))

    d.rounded_rectangle((160, 800, 1640, 1045), radius=22, fill="#f8fafc", outline="#cbd5e1", width=3)
    d.text((205, 835), "Why this lifecycle matters", fill="#0f172a", font=FONT_H)
    benefits = [
        "Students do not waste money on meals they are not going to eat.",
        "Mess staff know expected breakfast, lunch and dinner headcount before cooking.",
        "Food wastage and shortage reduce because quantity is planned better.",
        "Overcrowding is easier to manage because food items and counters can be prepared according to demand.",
    ]
    y = 880
    for item in benefits:
        d.ellipse((210, y + 8, 222, y + 20), fill="#2563eb")
        d.text((240, y), item, fill="#1f2937", font=FONT_B)
        y += 36

    img.save(OUT_DIR / "meal_booking_lifecycle_workflow.png", quality=95)


if __name__ == "__main__":
    architecture_diagram()
    lifecycle_diagram()
    print(OUT_DIR / "architecture_diagram.png")
    print(OUT_DIR / "meal_booking_lifecycle_workflow.png")
