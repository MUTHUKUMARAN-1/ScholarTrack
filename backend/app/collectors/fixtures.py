"""
Realistic, source-attributed fixtures for approved public scholarship bodies.
Used for offline reproducibility, unit testing, and controlled grading verification.
"""

FULBRIGHT_FIXTURE_HTML = """
<div class="award-announcements">
  <div class="award-card" data-award-id="fulbright-open-study-2027">
    <h3 class="award-title"><a href="https://us.fulbrightonline.org/countries/europe-and-eurasia/germany/open-study-research-award">Fulbright Study/Research Award - Germany</a></h3>
    <div class="award-provider">U.S. Department of State / IIE</div>
    <div class="award-level">Master's / Doctoral / Independent Research</div>
    <div class="award-field">All Academic Disciplines</div>
    <div class="award-location">Germany</div>
    <div class="award-deadline">October 6, 2026 5:00 PM Eastern Time</div>
    <div class="award-benefits">Round-trip international transportation, monthly stipend of 1,200 EUR to cover room, board, and living expenses, health benefit plan, and 24/7 support.</div>
    <div class="award-eligibility">Applicants must be U.S. citizens at time of application. Must hold a Bachelor's degree or equivalent before the start of the grant. Proficient in German recommended.</div>
    <p class="award-excerpt">The Fulbright U.S. Student Program expands perspectives through academic and professional advancement and cross-cultural dialogue.</p>
  </div>

  <div class="award-card" data-award-id="fulbright-eta-taiwan-2027">
    <h3 class="award-title"><a href="https://us.fulbrightonline.org/countries/east-asia-pacific/taiwan/english-teaching-assistant-award">Fulbright English Teaching Assistant (ETA) Award - Taiwan</a></h3>
    <div class="award-provider">Fulbright Taiwan / Foundation for Scholarly Exchange</div>
    <div class="award-level">Undergraduate Seniors / Master's</div>
    <div class="award-field">Education / Humanities / Linguistics</div>
    <div class="award-location">Taiwan</div>
    <div class="award-deadline">October 6, 2026 5:00 PM Eastern Time</div>
    <div class="award-benefits">Monthly living stipend (NT$ 40,000 - 50,000), round-trip airfare, housing allowance, health insurance, and Mandarin language tutoring stipend.</div>
    <div class="award-eligibility">Open to graduating seniors and recent college graduates who are U.S. citizens. Passion for teaching English; no prior Chinese language requirement.</div>
    <p class="award-excerpt">ETAs are placed in elementary and junior high schools throughout Taiwan to assist local English teachers.</p>
  </div>

  <div class="award-card" data-award-id="fulbright-rolling-special-fellowship">
    <h3 class="award-title"><a href="https://us.fulbrightonline.org/applicants/special-fellowships-rolling">Fulbright-Fogarty Fellowships in Global Health - Rolling Review</a></h3>
    <div class="award-provider">Fulbright / NIH Fogarty International Center</div>
    <div class="award-level">Doctoral / Medical Students</div>
    <div class="award-field">Medicine & Public Health</div>
    <div class="award-location">Multiple Countries (Sub-Saharan Africa, Latin America, South Asia)</div>
    <!-- Notice: Rolling / Unspecified deadline -->
    <div class="award-deadline">Rolling Application / Open Review</div>
    <div class="award-benefits">Full research support, travel stipend, living allowance, and mentorship from NIH Fogarty Global Health Centers.</div>
    <div class="award-eligibility">Currently enrolled in an accredited MD, PhD, or DrPH program in clinical or public health sciences. U.S. citizenship required.</div>
    <p class="award-excerpt">Designed for medical students and graduate students interested in pursuing clinical research in resource-limited settings.</p>
  </div>
</div>
"""

# Fixture with an updated/revised deadline for testing deadline-change tracking
FULBRIGHT_REVISED_DEADLINE_HTML = """
<div class="award-announcements">
  <div class="award-card" data-award-id="fulbright-open-study-2027">
    <h3 class="award-title"><a href="https://us.fulbrightonline.org/countries/europe-and-eurasia/germany/open-study-research-award">Fulbright Study/Research Award - Germany</a></h3>
    <div class="award-provider">U.S. Department of State / IIE</div>
    <div class="award-level">Master's / Doctoral / Independent Research</div>
    <div class="award-field">All Academic Disciplines</div>
    <div class="award-location">Germany</div>
    <!-- REVISED: deadline extended by two weeks to October 20, 2026 -->
    <div class="award-deadline">October 20, 2026 5:00 PM Eastern Time</div>
    <div class="award-benefits">Round-trip international transportation, monthly stipend of 1,350 EUR to cover room, board, and living expenses, health benefit plan, and 24/7 support.</div>
    <div class="award-eligibility">Applicants must be U.S. citizens at time of application. Must hold a Bachelor's degree or equivalent before the start of the grant. Proficient in German recommended.</div>
    <p class="award-excerpt">The Fulbright U.S. Student Program expands perspectives through academic and professional advancement and cross-cultural dialogue.</p>
  </div>
</div>
"""

DAAD_FIXTURE_HTML = """
<table class="daad-scholarship-table">
  <thead>
    <tr>
      <th>Programme Title & Link</th>
      <th>Target Group</th>
      <th>Subject Area</th>
      <th>Country of Origin / Destination</th>
      <th>Application Deadline</th>
      <th>Value & Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="daad-row" id="daad-prog-50015537">
      <td>
        <a class="program-link" href="https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?status=3&origin=190&subjectGrps=&daad=&q=Master+Studies&page=1&detail=50015537">
          DAAD Master Studies for All Academic Disciplines
        </a>
      </td>
      <td class="target-group">Graduates with Bachelor's Degree</td>
      <td class="subject-area">All Disciplines (except fine arts & architecture)</td>
      <td class="region">Destination: Germany (All international applicants)</td>
      <td class="deadline-cell">15 November 2026 23:59 Central European Time</td>
      <td class="details-cell">
        <div class="scholarship-amount">Monthly payments of 934 euros, payments towards health, accident and personal liability insurance cover, travel allowance of 860 euros.</div>
        <div class="eligibility-info">Graduates of any nationality who have completed their first degree with above-average results no more than 6 years ago.</div>
        <div class="excerpt-text">Provides funding for a complete Master's degree programme at a state or state-recognized German university.</div>
      </td>
    </tr>

    <tr class="daad-row" id="daad-prog-57135739">
      <td>
        <a class="program-link" href="https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=57135739">
          Research Grants - Doctoral Programmes in Germany
        </a>
      </td>
      <td class="target-group">Doctoral Candidates / PhD Students</td>
      <td class="subject-area">STEM, Social Sciences & Humanities</td>
      <td class="region">Destination: Germany</td>
      <td class="deadline-cell">31 October 2026 23:59 Central European Time</td>
      <td class="details-cell">
        <div class="scholarship-amount">Monthly scholarship of 1,300 euros for doctoral candidates, allowances for health insurance, travel subsidy, and annual research grant.</div>
        <div class="eligibility-info">Excellently qualified university graduates who hold a Master's degree at the time they begin the grant. Open to international researchers worldwide.</div>
        <div class="excerpt-text">Primary aim is to promote doctoral projects in Germany under the supervision of a university teacher or academic advisor.</div>
      </td>
    </tr>

    <tr class="daad-row" id="daad-prog-50026200">
      <td>
        <a class="program-link" href="https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=50026200">
          DAAD Postdoctoral Researchers International Mobility Experience (P.R.I.M.E.)
        </a>
      </td>
      <td class="target-group">Postdoctoral Researchers</td>
      <td class="subject-area">All Disciplines</td>
      <td class="region">Germany / Global Mobility</td>
      <!-- Notice: Specific date -->
      <td class="deadline-cell">30 August 2026 23:59 Central European Time</td>
      <td class="details-cell">
        <div class="scholarship-amount">Full employment contract at a German university for 18 months (12 months abroad + 6 months return phase in Germany). Standard German TV-L E13 pay scale.</div>
        <div class="eligibility-info">Outstanding researchers with a completed PhD/doctorate. Applicants can be of any nationality. Must have confirmed host institutions.</div>
        <div class="excerpt-text">Supports the international mobility of postdoctoral researchers by providing employment contracts instead of pure stipends.</div>
      </td>
    </tr>
  </tbody>
</table>
"""

NSF_GRFP_FIXTURE_HTML = """
<div class="nsf-grfp-catalog">
  <div class="grfp-item" id="grfp-comp-eng">
    <h2 class="solicitation-title"><a href="https://www.nsfgrfp.org/applicants/deadlines/engineering-cise">NSF Graduate Research Fellowship Program (GRFP) - CISE & Engineering</a></h2>
    <div class="sponsor">National Science Foundation (NSF)</div>
    <div class="award-type">Fellowship</div>
    <div class="eligible-levels">Senior Undergraduates / 1st & 2nd Year Graduate Students</div>
    <div class="field-of-study">Computer Science, Information Science & Engineering</div>
    <div class="citizenship-req">United States Citizen, US National, or Permanent Resident</div>
    <div class="submission-deadline">October 19, 2026 5:00 PM Local Time (Eastern Time)</div>
    <div class="benefits-summary">Three-year annual stipend of $37,000, along with a $16,000 cost of education allowance for tuition and fees paid directly to the graduate institution.</div>
    <div class="eligibility-summary">Must be pursuing full-time, research-based master's or doctoral degrees in NSF-supported STEM disciplines. High academic merit and broader impacts potential.</div>
    <div class="synopsis">The NSF GRFP recognizes and supports outstanding graduate students in NSF-supported science, technology, engineering, and mathematics disciplines.</div>
  </div>

  <div class="grfp-item" id="grfp-life-sciences">
    <h2 class="solicitation-title"><a href="https://www.nsfgrfp.org/applicants/deadlines/life-sciences">NSF GRFP - Life Sciences & Chemistry</a></h2>
    <div class="sponsor">National Science Foundation (NSF)</div>
    <div class="award-type">Fellowship</div>
    <div class="eligible-levels">Senior Undergraduates / 1st & 2nd Year Graduate Students</div>
    <div class="field-of-study">Life Sciences, Chemistry & Geosciences</div>
    <div class="citizenship-req">United States Citizen, US National, or Permanent Resident</div>
    <div class="submission-deadline">October 20, 2026 5:00 PM Eastern Time</div>
    <div class="benefits-summary">$37,000 yearly stipend for 3 years, $16,000 educational allowance, access to international research opportunities (INTERN) and supercomputer resources.</div>
    <div class="eligibility-summary">U.S. citizens and permanent residents pursuing master's or doctoral degrees in chemistry, biochemistry, biophysics, neuroscience, or ecology.</div>
    <div class="synopsis">Recognizes and supports future leaders in scientific research across the United States.</div>
  </div>
</div>
"""

MALFORMED_HTML_FIXTURE = """
<div>
  <!-- Malformed without tags closed, missing deadlines, corrupt data -->
  <h3><a href="">Broken Scholarship without title link</a>
  <div>Provider missing
  <p>No deadline anywhere here, just broken unclosed HTML
  <div>Some partial text
</div>
"""
