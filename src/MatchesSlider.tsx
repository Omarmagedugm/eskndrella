import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  ChevronLeft, 
  CalendarDays, 
  Clock3, 
  MapPin, 
  ExternalLink, 
  X, 
  Bookmark, 
  Check, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { subscribePublic, firebaseReady } from './firebase';
import { sportsContent, type Fixture, formatSportsDay, formatKickoff, fixtureGoogleSearchUrl } from './sportsModel';
import { ClubLogo, registerCustomClubLogos } from './clubLogos';
import './matchesSlider.css';

interface MatchesSliderProps {
  navigate: (tab: string) => void;
  save?: (text: string) => void;
}

export default function MatchesSlider({ navigate, save }: MatchesSliderProps) {
  const [remoteFixtures, setRemoteFixtures] = useState<Fixture[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'finished' | 'upcoming'>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [activeModalMatch, setActiveModalMatch] = useState<Fixture | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);

  const [clubsVersion, setClubsVersion] = useState(0);

  // Subscribe to sports fixtures and clubs in Firestore
  useEffect(() => {
    let unsubFixtures = () => {};
    let unsubClubs = () => {};
    if (firebaseReady) {
      unsubFixtures = subscribePublic('sports_fixtures', (data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setRemoteFixtures(data.map(d => ({
            ...d,
            name: d.name || `${d.home} × ${d.away}`,
            clubIds: Array.isArray(d.clubIds) ? d.clubIds : [],
            sourceIds: Array.isArray(d.sourceIds) ? d.sourceIds : []
          })));
        }
      });
      unsubClubs = subscribePublic('sports_clubs', (data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          registerCustomClubLogos(data);
          setClubsVersion(v => v + 1);
        }
      });
    }
    return () => {
      unsubFixtures();
      unsubClubs();
    };
  }, []);

  // Merge default + remote fixtures
  const allFixtures = useMemo(() => {
    if (!remoteFixtures.length) return sportsContent.fixtures as Fixture[];
    const remoteIds = new Set(remoteFixtures.map(r => r.id));
    return [
      ...remoteFixtures.filter((r: any) => r.published !== false && r.archived !== true),
      ...((sportsContent.fixtures as Fixture[]).filter(d => !remoteIds.has(d.id)))
    ];
  }, [remoteFixtures]);

  // Determine match state: finished, live, upcoming
  const getMatchStatus = (f: Fixture): 'finished' | 'live' | 'upcoming' => {
    if (f.scheduleStatus === 'finished' || (typeof f.homeScore === 'number' && typeof f.awayScore === 'number')) {
      return 'finished';
    }
    if (f.scheduleStatus === 'live') {
      return 'live';
    }
    return 'upcoming';
  };

  // Filtered fixtures
  const filteredMatches = useMemo(() => {
    return allFixtures.filter(match => {
      const status = getMatchStatus(match);
      if (periodFilter === 'finished' && status !== 'finished') return false;
      if (periodFilter === 'upcoming' && status === 'finished') return false;
      if (selectedClub !== 'all' && !match.clubIds.includes(selectedClub)) return false;
      return true;
    }).sort((a, b) => {
      const statusA = getMatchStatus(a);
      const statusB = getMatchStatus(b);
      // Finished matches sorted latest to earliest
      if (statusA === 'finished' && statusB === 'finished') {
        return (b.date || '0').localeCompare(a.date || '0');
      }
      if (statusA === 'finished' && statusB !== 'finished') return 1;
      if (statusA !== 'finished' && statusB === 'finished') return -1;
      return (a.date || '9999').localeCompare(b.date || '9999');
    });
  }, [allFixtures, periodFilter, selectedClub]);

  // Counts for header badges
  const counts = useMemo(() => {
    let finishedCount = 0;
    let upcomingCount = 0;
    for (const f of allFixtures) {
      if (getMatchStatus(f) === 'finished') finishedCount++;
      else upcomingCount++;
    }
    return { finished: finishedCount, upcoming: upcomingCount, total: allFixtures.length };
  }, [allFixtures]);

  // Slider navigation
  const scrollTrack = (direction: 'next' | 'prev') => {
    if (!trackRef.current) return;
    const scrollAmount = 260;
    const dx = direction === 'next' ? -scrollAmount : scrollAmount;
    trackRef.current.scrollBy({ left: dx, behavior: 'smooth' });
  };

  const handleSaveMatch = (fixture: Fixture) => {
    const text = `مباراة: ${fixture.home} × ${fixture.away} (${fixture.competition}) - ${fixture.date || 'الموعد قيد التأكيد'}`;
    if (save) save(text);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <section className="matches-slider-section" aria-label="مباريات إسكندرية">
      {/* Shortened Header */}
      <div className="matches-slider-header-wrap">
        <div className="matches-slider-title-area">
          <h2>
            <Trophy size={17} />
            <span>مباريات إسكندرية</span>
            <div className="matches-slider-badge-counts">
              <span className="matches-badge-pill upcoming">{counts.upcoming.toLocaleString('ar-EG')} قادمة</span>
              <span className="matches-badge-pill">{counts.finished.toLocaleString('ar-EG')} نتائج</span>
            </div>
          </h2>
        </div>

        {/* Action buttons & navigation */}
        <div className="matches-slider-actions">
          <button
            type="button"
            className="matches-nav-btn"
            aria-label="المباراة السابقة"
            onClick={() => scrollTrack('prev')}
            title="السابق"
          >
            <ChevronRight size={17} />
          </button>
          <button
            type="button"
            className="matches-nav-btn"
            aria-label="المباراة التالية"
            onClick={() => scrollTrack('next')}
            title="التالي"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            className="matches-all-link"
            onClick={() => navigate('city-sports')}
          >
            الجدول كامل <ArrowLeft size={13}/>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="matches-filter-bar" role="tablist" aria-label="تصفية المباريات">
        <button
          type="button"
          className={`matches-filter-chip ${periodFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('all')}
        >
          الكل
        </button>
        <button
          type="button"
          className={`matches-filter-chip ${periodFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('upcoming')}
        >
          <CalendarDays size={13}/> القادمة
        </button>
        <button
          type="button"
          className={`matches-filter-chip ${periodFilter === 'finished' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('finished')}
        >
          <CheckCircle2 size={13}/> النتائج
        </button>

        <div className="matches-filter-divider" />

        {/* Club filter pills */}
        {[
          { id: 'all', label: 'كل الأندية' },
          { id: 'ittihad', label: 'الاتحاد' },
          { id: 'smouha', label: 'سموحة' },
          { id: 'haras', label: 'الحرس' },
          { id: 'pharco', label: 'فاركو' },
          { id: 'olympic', label: 'الأوليمبي' },
          { id: 'sporting', label: 'سبورتنج' },
          { id: 'abuqir', label: 'أبو قير' }
        ].map(club => (
          <button
            type="button"
            key={club.id}
            className={`matches-filter-chip ${selectedClub === club.id ? 'active' : ''}`}
            onClick={() => setSelectedClub(club.id)}
          >
            {club.label}
          </button>
        ))}
      </div>

      {/* Compact Rectangular Cards Track */}
      <div className="matches-slider-viewport">
        {filteredMatches.length === 0 ? (
          <div className="matches-empty-state">
            <Trophy size={26}/>
            <span>مفيش مباريات متطابقة حاليًا.</span>
          </div>
        ) : (
          <div className="matches-slider-track" ref={trackRef}>
            {filteredMatches.map(match => {
              const status = getMatchStatus(match);
              const isFinished = status === 'finished';
              const isLive = status === 'live';
              const homeScore = typeof match.homeScore === 'number' ? match.homeScore : null;
              const awayScore = typeof match.awayScore === 'number' ? match.awayScore : null;
              const homeWon = isFinished && homeScore !== null && awayScore !== null && homeScore > awayScore;
              const awayWon = isFinished && homeScore !== null && awayScore !== null && awayScore > homeScore;

              return (
                <article
                  key={match.id}
                  className={`match-card-compact ${status}`}
                  onClick={() => setActiveModalMatch(match)}
                >
                  {/* Top: Competition & Status */}
                  <div className="match-mini-head">
                    <span className="match-mini-competition" title={match.competition}>
                      {match.competition}
                    </span>
                    <span className={`match-mini-status ${status}`}>
                      {isFinished ? 'انتهت' : isLive ? '🔴 مباشر' : 'قادمة'}
                    </span>
                  </div>

                  {/* Teams Row with Fixed Logos & Score/VS */}
                  <div className="match-mini-teams">
                    {/* Home Team */}
                    <div className="match-mini-team">
                      <ClubLogo
                        name={match.home}
                        customUrl={match.homeLogo}
                        size={22}
                      />
                      <span className={`match-mini-team-name ${homeWon ? 'winner' : ''}`}>
                        {match.home}
                      </span>
                    </div>

                    {/* Center: Score or VS / Kickoff */}
                    <div className="match-mini-center">
                      {isFinished && homeScore !== null && awayScore !== null ? (
                        <span className="match-mini-score">
                          {homeScore} : {awayScore}
                        </span>
                      ) : isLive ? (
                        <span className="match-mini-score" style={{ background: '#b91c1c' }}>
                          {homeScore ?? 0} : {awayScore ?? 0}
                        </span>
                      ) : (
                        <>
                          <span className="match-mini-vs">VS</span>
                          {match.startsAt && (
                            <span className="match-mini-kickoff">
                              {formatKickoff(match.startsAt)}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="match-mini-team away">
                      <ClubLogo
                        name={match.away}
                        customUrl={match.awayLogo}
                        size={22}
                      />
                      <span className={`match-mini-team-name ${awayWon ? 'winner' : ''}`}>
                        {match.away}
                      </span>
                    </div>
                  </div>

                  {/* Foot: Date & Venue */}
                  <div className="match-mini-foot">
                    <span className="match-mini-foot-item">
                      <CalendarDays size={11} />
                      <span>{match.date ? formatSportsDay(match.date).replace(/،.*$/, '') : 'قيد التأكيد'}</span>
                    </span>
                    {match.venue && (
                      <span className="match-mini-foot-item" title={match.venue}>
                        <MapPin size={11} />
                        <span>{match.venue.replace(/^(استاد|صالة)\s+/, '')}</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal with full Match Details */}
      {activeModalMatch && (
        <div className="match-modal-overlay" onClick={() => setActiveModalMatch(null)}>
          <div className="match-modal-card" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="match-modal-close"
              onClick={() => setActiveModalMatch(null)}
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>

            <div className="match-modal-head">
              <span>{activeModalMatch.competition}</span>
              <h3>{activeModalMatch.home} × {activeModalMatch.away}</h3>
            </div>

            {/* Scoreboard in modal with Fixed Logos */}
            <div className="match-modal-scoreboard">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <ClubLogo name={activeModalMatch.home} customUrl={activeModalMatch.homeLogo} size={42} />
                <strong style={{ fontSize: 13 }}>{activeModalMatch.home}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {getMatchStatus(activeModalMatch) === 'finished' &&
                typeof activeModalMatch.homeScore === 'number' &&
                typeof activeModalMatch.awayScore === 'number' ? (
                  <div style={{ background: '#faf6ee', color: '#102a43', padding: '6px 14px', borderRadius: 10, fontSize: 20, fontWeight: 900 }}>
                    {activeModalMatch.homeScore} : {activeModalMatch.awayScore}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(250, 246, 238, 0.2)', color: '#faf6ee', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 900 }}>
                    VS
                  </div>
                )}
                <small style={{ marginTop: 4, fontSize: 10, color: '#f0c64a', fontWeight: 800 }}>
                  {getMatchStatus(activeModalMatch) === 'finished' ? 'نتيجة نهائية' : formatKickoff(activeModalMatch.startsAt)}
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <ClubLogo name={activeModalMatch.away} customUrl={activeModalMatch.awayLogo} size={42} />
                <strong style={{ fontSize: 13 }}>{activeModalMatch.away}</strong>
              </div>
            </div>

            {/* Match info list */}
            <div className="match-modal-info-list">
              <div className="match-modal-info-item">
                <CalendarDays size={16} />
                <div>
                  <strong>التاريخ:</strong>{' '}
                  {activeModalMatch.date ? formatSportsDay(activeModalMatch.date) : 'قيد التأكيد'}
                  {activeModalMatch.startsAt && ` — ${formatKickoff(activeModalMatch.startsAt)}`}
                </div>
              </div>

              {activeModalMatch.venue && (
                <div className="match-modal-info-item">
                  <MapPin size={16} />
                  <div>
                    <strong>الملعب:</strong> {activeModalMatch.venue}
                  </div>
                </div>
              )}
            </div>

            {/* Note / Analysis */}
            {activeModalMatch.note && (
              <div className="match-modal-note">
                {activeModalMatch.note}
              </div>
            )}

            {/* Actions */}
            <div className="match-modal-actions">
              <a
                href={fixtureGoogleSearchUrl(activeModalMatch)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                تغطية المباراة <ExternalLink size={13} />
              </a>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleSaveMatch(activeModalMatch)}
              >
                {savedSuccess ? (
                  <>تم الحفظ <Check size={14} color="#16a34a"/></>
                ) : (
                  <>حفظ بالمفضلة <Bookmark size={14}/></>
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActiveModalMatch(null);
                  navigate('city-sports');
                }}
              >
                قسم الرياضة
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
