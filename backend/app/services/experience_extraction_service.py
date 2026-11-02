
import re
from datetime import date


MONTHS = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

MONTH_PATTERN = (
    r"Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|"
    r"Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|"
    r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
)

DATE_PATTERN = (
    rf"(?:"
    rf"(?:{MONTH_PATTERN})\s+\d{{4}}"
    rf"|(?:0?[1-9]|1[0-2])/\d{{4}}"
    rf"|\d{{4}}"
    rf")"
)

DATE_RANGE_PATTERN = re.compile(
    rf"(?P<start>{DATE_PATTERN})"
    rf"\s*(?:-|–|—|\bto\b)\s*"
    rf"(?P<end>{DATE_PATTERN}|present|current|now)",
    re.IGNORECASE,
)

EXPERIENCE_HEADINGS = {
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "work history",
}

STOP_HEADINGS = {
    "education",
    "academic qualifications",
    "skills",
    "technical skills",
    "projects",
    "certifications",
    "achievements",
    "languages",
    "interests",
}


def extract_experience_section(text: str) -> str:
    """Extract the employment section to avoid parsing education dates."""

    if not text:
        return ""

    lines = text.splitlines()

    start_index = None

    for index, line in enumerate(lines):
        heading = line.strip().lower().rstrip(":")
        if heading in EXPERIENCE_HEADINGS:
            start_index = index + 1
            break

    if start_index is None:
        return ""

    section_lines = []

    for line in lines[start_index:]:
        heading = line.strip().lower().rstrip(":")

        if heading in STOP_HEADINGS:
            break

        section_lines.append(line)

    return "\n".join(section_lines)


def parse_date(value: str, today: date | None = None) -> date:
    """Convert supported resume date formats into a date."""

    today = today or date.today()
    value = value.strip().lower()

    if value in {"present", "current", "now"}:
        return date(today.year, today.month, 1)

    numeric_match = re.fullmatch(
        r"(0?[1-9]|1[0-2])/(\d{4})",
        value,
    )

    if numeric_match:
        return date(
            int(numeric_match.group(2)),
            int(numeric_match.group(1)),
            1,
        )

    month_year_match = re.fullmatch(
        rf"({MONTH_PATTERN})\s+(\d{{4}})",
        value,
        re.IGNORECASE,
    )

    if month_year_match:
        month_name = month_year_match.group(1).lower()
        month = MONTHS[month_name]
        year = int(month_year_match.group(2))
        return date(year, month, 1)

    year_match = re.fullmatch(r"\d{4}", value)

    if year_match:
        return date(int(value), 1, 1)

    raise ValueError(f"Unsupported date format: {value}")


def month_difference(start: date, end: date) -> int:
    """Calculate inclusive calendar months between two dates."""

    return (
        (end.year - start.year) * 12
        + end.month - start.month
        + 1
    )


def merge_intervals(intervals: list[tuple[date, date]]) -> list:
    """Merge overlapping employment date ranges."""

    if not intervals:
        return []

    intervals.sort(key=lambda item: item[0])

    merged = [list(intervals[0])]

    for start, end in intervals[1:]:
        last = merged[-1]

        if start <= last[1]:
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])

    return [
        (start, end)
        for start, end in merged
    ]


def calculate_total_months(
    intervals: list[tuple[date, date]],
) -> int:
    """Calculate total months without double-counting overlaps."""

    merged = merge_intervals(intervals)

    return sum(
        month_difference(start, end)
        for start, end in merged
    )


def extract_candidate_experience(
    resume_text: str,
    today: date | None = None,
) -> dict:
    """
    Extract employment date ranges from a resume.

    Internships are reported separately from professional experience.
    """

    today = today or date.today()

    section = extract_experience_section(resume_text)

    if not section:
        return {
            "experience_found": False,
            "professional_experience_months": None,
            "professional_experience_years": None,
            "internship_months": 0,
            "entries": [],
        }

    lines = section.splitlines()

    professional_intervals = []
    internship_intervals = []
    entries = []

    for match in DATE_RANGE_PATTERN.finditer(section):
        start = parse_date(match.group("start"), today)
        end = parse_date(match.group("end"), today)

        if end < start:
            continue

        if end > date(today.year, today.month, 1):
            continue

        line_index = section[:match.start()].count("\n")

        context = " ".join(
            lines[max(0, line_index - 2):line_index + 2]
        ).lower()

        is_internship = bool(
            re.search(r"\bintern(?:ship)?\b", context)
        )

        entry = {
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "type": "internship" if is_internship else "professional",
            "months": month_difference(start, end),
        }

        entries.append(entry)

        interval = (start, end)

        if is_internship:
            internship_intervals.append(interval)
        else:
            professional_intervals.append(interval)

    professional_months = calculate_total_months(
        professional_intervals
    )

    internship_months = calculate_total_months(
        internship_intervals
    )

    return {
        "experience_found": bool(entries),
        "professional_experience_months": professional_months,
        "professional_experience_years": round(
            professional_months / 12, 2
        ),
        "internship_months": internship_months,
        "entries": entries,
    }
