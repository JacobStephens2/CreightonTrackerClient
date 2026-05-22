export function renderSystemGuideView(container: HTMLElement): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');

  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'font-size:0.875rem;line-height:1.65';
  card.innerHTML = `
    <h2 style="font-size:1.25rem;margin-bottom:16px">Creighton Model FertilityCare\u2122 System Guide</h2>

    <div style="border-left:3px solid var(--accent);padding:10px 14px;margin-bottom:16px;font-size:0.825rem;color:var(--text-secondary);line-height:1.55">
      The codes and rules summarized below come from <em><a href="https://openlibrary.org/isbn/9780962648540" target="_blank" rel="noopener" style="color:var(--accent)">The Creighton Model FertilityCare\u2122 System: An Authentic Language of a Woman's Health and Fertility</a></em> by Thomas W. Hilgers, M.D. (Pope Paul VI Institute Press; ISBN 978-0-9626485-4-0). It is the authoritative reference for CrMS and is highly recommended for anyone learning the method.
    </div>

    <div class="section-label" style="margin-top:0">Overview</div>
    <p style="margin-bottom:12px">
      The Creighton Model FertilityCare\u2122 System (CrMS) is a standardized, science-based method of natural family planning developed at Creighton University. It trains women to observe and record specific biological markers \u2014 primarily cervical mucus characteristics and bleeding patterns \u2014 that reflect the hormonal events of the menstrual and fertility cycle.
    </p>
    <p style="margin-bottom:16px">
      Unlike fertility apps that calculate averages from past cycle data, CrMS is based on real-time, daily observations, making it accurate across cycles of any length or regularity.
    </p>

    <div class="section-label">Daily Observation</div>
    <p style="margin-bottom:12px">
      Women check for cervical and vaginal secretions every time they use the bathroom and once before bed. The technique is an <strong>external vulvar observation</strong> performed using folded toilet paper wiped front to back. The woman examines what appears on the paper for:
    </p>
    <ul style="margin:0 0 12px 20px">
      <li><strong>Stretch</strong> \u2014 how far the mucus extends between thumb and index finger</li>
      <li><strong>Color</strong> \u2014 clear (K), cloudy (C), yellow (Y), brown (B), etc.</li>
      <li><strong>Consistency</strong> \u2014 dry, damp, shiny, sticky, tacky, stretchy, or lubricative</li>
      <li><strong>Sensation</strong> \u2014 the feeling of lubrication or wetness at the vulva</li>
    </ul>
    <p style="margin-bottom:16px">
      Only the <strong>most fertile sign observed that day</strong> is recorded. If fertile mucus is noticed once but dry conditions prevail the rest of the day, the mucus observation takes precedence.
    </p>

    <div class="section-label">Bleeding Codes</div>
    <p style="margin-bottom:8px">Bleeding patterns are recorded using the Vaginal Discharge Recording System (VDRS):</p>
    <ul style="margin:0 0 12px 20px">
      <li><strong>H</strong> = Heavy flow</li>
      <li><strong>M</strong> = Moderate flow</li>
      <li><strong>L</strong> = Light flow</li>
      <li><strong>VL</strong> = Very light flow / spotting</li>
      <li><strong>B</strong> = Brown or black bleeding (old blood)</li>
    </ul>
    <p style="margin-bottom:16px">
      Women should continue checking for mucus presence during light and very light flow days, because mucus and bleeding can coexist.
    </p>

    <div class="section-label">Vulvar Observations (Non-Mucus)</div>
    <p style="margin-bottom:8px">
      These codes describe sensations and appearances at the vulva <strong>without actual cervical mucus discharge</strong>:
    </p>
    <ul style="margin:0 0 16px 20px">
      <li><strong>0</strong> = Dry \u2014 no discharge observed</li>
      <li><strong>2</strong> = Damp without lubrication (no mucus)</li>
      <li><strong>2W</strong> = Wet without lubrication (no mucus)</li>
      <li><strong>4</strong> = Shiny without lubrication (no mucus, but wet appearance)</li>
    </ul>

    <div class="section-label">Cervical Mucus Codes</div>
    <p style="margin-bottom:8px">
      These codes describe actual cervical mucus discharge with increasing stretchability:
    </p>
    <ul style="margin:0 0 12px 20px">
      <li><strong>6</strong> = Sticky (stretches \xBC inch)</li>
      <li><strong>8</strong> = Tacky (stretches \xBD\u2013\xBE inch)</li>
      <li><strong>10</strong> = Stretchy (stretches 1+ inch)</li>
      <li><strong>10DL</strong> = Damp / lubricative</li>
      <li><strong>10SL</strong> = Shiny / lubricative</li>
      <li><strong>10WL</strong> = Wet / lubricative</li>
    </ul>
    <p style="margin-bottom:16px">
      Only codes 6, 8, and 10+ indicate the presence of cervical mucus. The distinction matters because mucus days are charted differently from non-mucus days.
    </p>

    <div class="section-label">Peak-Type vs. Non-Peak-Type Mucus</div>
    <p style="margin-bottom:8px">
      Cervical mucus is divided into two categories:
    </p>
    <ul style="margin:0 0 12px 20px">
      <li><strong>Peak-type mucus</strong> \u2014 any mucus that is clear (K), stretchy (10), or has the sensation of lubrication (L). This reflects a high-estrogen environment conducive to sperm survival.</li>
      <li><strong>Non-peak-type mucus</strong> \u2014 mucus that is not clear, not stretchy, and not lubricative. Includes sticky (6), tacky (8), cloudy (C), gummy (G), or yellow (Y) discharge.</li>
    </ul>

    <div class="section-label">Mucus Characteristics</div>
    <p style="margin-bottom:8px">Characteristic modifiers are added to the stretch code (multi-select; combine as needed):</p>
    <ul style="margin:0 0 16px 20px">
      <li><strong>C</strong> = Cloudy (white)</li>
      <li><strong>K</strong> = Clear (peak-type)</li>
      <li><strong>L</strong> = Lubricative (peak-type)</li>
      <li><strong>P</strong> = Pasty (creamy)</li>
      <li><strong>G</strong> = Gummy (gluey)</li>
      <li><strong>B</strong> = Brown</li>
      <li><strong>Y</strong> = Yellow (even pale yellow)</li>
    </ul>
    <p style="margin-bottom:16px;font-size:0.85rem;color:var(--text-secondary)">
      Combine modifiers freely: e.g. <strong>CK</strong> = cloudy/clear, <strong>PC</strong> = pasty cloudy, <strong>6PC</strong> = sticky pasty cloudy.
    </p>

    <div class="section-label">Frequency</div>
    <p style="margin-bottom:8px">How often the most fertile sign was observed that day:</p>
    <ul style="margin:0 0 16px 20px">
      <li><strong>x1</strong> = Once</li>
      <li><strong>x2</strong> = Twice</li>
      <li><strong>x3</strong> = Three times</li>
      <li><strong>AD</strong> = All day</li>
    </ul>

    <div class="section-label">Color-Coded Stamps</div>
    <p style="margin-bottom:8px">
      Each day\u2019s observation receives a color-coded stamp on the chart:
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:0.8125rem">
      <tr style="border-bottom:1px solid var(--outline-soft)">
        <td style="padding:8px 6px"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--stamp-red);vertical-align:middle"></span></td>
        <td style="padding:8px 6px"><strong>Red</strong></td>
        <td style="padding:8px 6px">Days of bleeding (H, M, L, VL, B)</td>
      </tr>
      <tr style="border-bottom:1px solid var(--outline-soft)">
        <td style="padding:8px 6px"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--stamp-green);vertical-align:middle"></span></td>
        <td style="padding:8px 6px"><strong>Green</strong></td>
        <td style="padding:8px 6px">Dry / non-mucus day \u2014 infertile</td>
      </tr>
      <tr style="border-bottom:1px solid var(--outline-soft)">
        <td style="padding:8px 6px"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--stamp-white);box-shadow:inset 0 0 0 1px rgba(122,123,121,0.2);vertical-align:middle"></span></td>
        <td style="padding:8px 6px"><strong>White</strong></td>
        <td style="padding:8px 6px">Any day of cervical mucus discharge \u2014 possible fertility</td>
      </tr>
      <tr style="border-bottom:1px solid var(--outline-soft)">
        <td style="padding:8px 6px"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--stamp-yellow);vertical-align:middle"></span></td>
        <td style="padding:8px 6px"><strong>Yellow</strong></td>
        <td style="padding:8px 6px">Infertile pattern (Base Infertile Pattern) \u2014 your stable, unchanging baseline of observations</td>
      </tr>
    </table>
    <p style="margin-bottom:16px">
      A \ud83d\udc23 symbol on the stamp indicates potential fertility \u2014 it appears on mucus days and on the three post-Peak count days.
    </p>

    <div class="section-label">The Peak Day</div>
    <p style="margin-bottom:12px">
      The <strong>Peak Day</strong> is the most important fertility marker in CrMS. It is defined as:
    </p>
    <blockquote style="border-left:3px solid var(--accent);padding:8px 14px;margin:0 0 12px;color:var(--text-secondary);font-style:italic">
      The last day of any mucus discharge that is clear (K), stretchy (10), or has the sensation of lubrication (L).
    </blockquote>
    <p style="margin-bottom:12px">
      The Peak Day is identified <strong>retroactively</strong> \u2014 it can only be confirmed after the following day returns to non-peak or dry conditions. Research shows the Peak Day falls within \xB13 days of ovulation 95% of the time.
    </p>

    <div class="section-label">Post-Peak Count</div>
    <p style="margin-bottom:8px">
      Once the Peak Day is confirmed, a counting protocol is applied:
    </p>
    <ul style="margin:0 0 12px 20px">
      <li><strong>P+1</strong> = Day after peak-type mucus ends</li>
      <li><strong>P+2</strong> = Second day after Peak</li>
      <li><strong>P+3</strong> = Third day after Peak</li>
      <li><strong>P+4 (end of day)</strong> = Resumption of infertile phase</li>
    </ul>
    <p style="margin-bottom:16px">
      These three post-Peak days are marked on the chart with numbered stamps and a \ud83d\udc23 symbol to indicate that conception remains possible until the count is complete.
    </p>

    <div class="section-label">Observation Code Examples</div>
    <ul style="margin:0 0 16px 20px">
      <li><strong>10KL x2</strong> \u2192 Stretchy, clear, lubricative; seen twice \u2192 White stamp (peak-type)</li>
      <li><strong>8CG x1</strong> \u2192 Tacky, cloudy, gummy; seen once \u2192 White stamp (non-peak mucus)</li>
      <li><strong>0</strong> \u2192 Dry \u2192 Green stamp</li>
      <li><strong>M</strong> \u2192 Moderate bleeding \u2192 Red stamp</li>
      <li><strong>VL B</strong> \u2192 Very light brown spotting \u2192 Red stamp</li>
    </ul>

    <div class="section-label">Important Reminder</div>
    <p style="margin-bottom:12px">
      The Creighton Model FertilityCare\u2122 System should be learned through proper instruction with a certified FertilityCare Practitioner (FCP). Women typically meet with an FCP for at least eight private follow-up sessions in the first year.
    </p>
    <p style="margin-bottom:12px">
      To find an instructor in your area, visit <a href="https://www.fertilitycare.org/find-a-center/" target="_blank" rel="noopener" style="color:var(--accent)">FertilityCare.org</a>.
    </p>
    <p style="margin-bottom:0;font-size:0.78rem;color:var(--text-muted)">
      This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute. Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America.
    </p>

    <div class="section-label" style="margin-top:20px">Sources</div>
    <ol style="margin:0 0 0 20px;font-size:0.78rem;color:var(--text-secondary);line-height:1.7">
      <li><a href="https://www.birthpointe.com/creighton-model-fertilitycare-system/" target="_blank" rel="noopener" style="color:var(--accent)">Creighton Model FertilityCare System \u2014 BirthPointe</a></li>
      <li><a href="https://saintpaulvi.com/intro/naprotechnology/" target="_blank" rel="noopener" style="color:var(--accent)">NaProTechnology: Life-Affirming Women\u2019s Healthcare \u2014 Saint Paul VI Institute</a></li>
      <li><a href="https://creightonmodel.com/applications-of-naprotechnology/" target="_blank" rel="noopener" style="color:var(--accent)">Applications of NaProTechnology \u2014 Creighton Model</a></li>
      <li><a href="https://www.nfpgoodforlife.com/closer-look-at-creighton-method/" target="_blank" rel="noopener" style="color:var(--accent)">NFP 101: A Closer Look at Creighton Model</a></li>
      <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12306780/" target="_blank" rel="noopener" style="color:var(--accent)">Pregnancies, intentions, and fertility behaviors during use of CrMS \u2014 PMC</a></li>
      <li><a href="https://epublications.marquette.edu/cgi/viewcontent.cgi?article=1032&context=nursing_fac" target="_blank" rel="noopener" style="color:var(--accent)">Accuracy of the Peak Day of Cervical Mucus as a Biological Marker \u2014 Marquette University</a></li>
      <li><a href="https://faustinacare.com/about/the-creighton-model-system/" target="_blank" rel="noopener" style="color:var(--accent)">The Creighton Model System \u2014 Faustina FertilityCare Center</a></li>
      <li><a href="https://www.nfpphysician.com/post/the-cervical-mucus-method-made-simple" target="_blank" rel="noopener" style="color:var(--accent)">The Cervical Mucus Method of NFP Made Simple</a></li>
      <li><a href="https://saintpaulvi.com/PDF/CrMS_App_Copyright.pdf" target="_blank" rel="noopener" style="color:var(--accent)">CrMS Application \u2014 Saint Paul VI Institute (PDF)</a></li>
      <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4861655/" target="_blank" rel="noopener" style="color:var(--accent)">Impact of instruction in CrMS on sexual behavior \u2014 PMC</a></li>
      <li><a href="https://rrmacademy.org/faqs/what-is-the-difference-between-creighton-model-marquette-method-femm-and-symptot/" target="_blank" rel="noopener" style="color:var(--accent)">Creighton vs Marquette vs FEMM vs Symptothermal \u2014 RRM Academy</a></li>
      <li><a href="https://naprotechnology.com" target="_blank" rel="noopener" style="color:var(--accent)">NaProTECHNOLOGY: The Result of 30 Years of Research</a></li>
      <li><a href="https://www.fiatfertilitycare.co.uk/how-we-work/creighton-model/charting-cycles/" target="_blank" rel="noopener" style="color:var(--accent)">Charting Cycles \u2014 Fiat FertilityCare UK</a></li>
      <li><a href="https://healthvista.net/wp-content/uploads/2015/04/CreightonModelFertilityCareSystem3.pdf" target="_blank" rel="noopener" style="color:var(--accent)">Creighton Model FertilityCare System \u2014 Health Vista (PDF)</a></li>
      <li><a href="https://www.groesbeckfertility.com/post/yellow-stamps-the-answer-to-all-your-problems-maybe" target="_blank" rel="noopener" style="color:var(--accent)">Yellow Stamps \u2014 Groesbeck Fertility</a></li>
      <li><a href="https://queenofheartsfertility.org/crms" target="_blank" rel="noopener" style="color:var(--accent)">Education in the CrMS \u2014 Queen of Hearts Fertility</a></li>
      <li><a href="https://creightonmodel.com/background/" target="_blank" rel="noopener" style="color:var(--accent)">Background of the CrMS System \u2014 Creighton Model</a></li>
      <li><a href="https://www.factsaboutfertility.org/whos-best-at-identifying-peak-day-women-experts-or-an-algorithm/" target="_blank" rel="noopener" style="color:var(--accent)">Who\u2019s Best at Identifying Peak Day? \u2014 FACTS</a></li>
      <li><a href="https://shop.miracare.com/blogs/resources/cervical-mucus-changes-during-ovulation" target="_blank" rel="noopener" style="color:var(--accent)">Cervical Mucus During Ovulation \u2014 MiraCare</a></li>
      <li><a href="https://pubmed.ncbi.nlm.nih.gov/32431450/" target="_blank" rel="noopener" style="color:var(--accent)">Identification of Postovulation Infertility with Progesterone \u2014 PubMed</a></li>
    </ol>
  `;

  wrapper.appendChild(card);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary btn-block';
  backBtn.textContent = 'Back to Settings';
  backBtn.style.marginTop = '4px';
  backBtn.addEventListener('click', () => {
    window.location.hash = '/settings';
  });
  wrapper.appendChild(backBtn);

  container.appendChild(wrapper);
}
