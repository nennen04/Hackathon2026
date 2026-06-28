import { useState, useEffect } from 'react';
import StepHeader from './components/StepHeader';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';
import NaturalLanguageInput, { extractKeywords } from './components/NaturalLanguageInput';
import IntentRefinement from './components/IntentRefinement';
import DestinationSelect from './components/DestinationSelect';
import IntentExtraction from './components/IntentExtraction';
import PlanComparison from './components/PlanComparison';
import SimilarPlanDrawer from './components/SimilarPlanDrawer';
import PlanDetailOverlay from './components/PlanDetailOverlay';
import EcoActionSelection from './components/EcoActionSelection';
import DetailedSchedule from './components/DetailedSchedule';
import FeedbackForm from './components/FeedbackForm';
import DepartureLocationLink from './components/DepartureLocationLink';
import DepartureLocationSheet from './components/DepartureLocationSheet';
import {
  DEFAULT_DEPARTURE_LOCATION,
  DEFAULT_FEEDBACK_COMMENT,
  DEFAULT_FREE_TEXT,
  DEFAULT_RATINGS,
  DEFAULT_SELECTED_CONDITIONS,
  ECO_ACTIONS,
  FEEDBACK_TOAST_MESSAGE,
  KEYWORD_CHIPS,
  ORIGINAL_PLAN,
  RECOMMENDED_PLAN,
  SIMILAR_PLANS,
  TRAVEL_INTENT,
} from './mockData';
import type { TravelPlan, TravelIntent } from './types';
import { generateTravelPlans } from './llm/planner';
import { extractTravelIntent, refineDestinationCandidates, type ExtractedIntent, type DestinationCandidate } from './llm/intentExtractor';

interface StepMeta {
  key: string;
  title: string;
  label: string;
  rightAction: 'help' | 'menu' | 'none';
  helpMessage?: string;
}

const STEPS: StepMeta[] = [
  {
    key: 'input',
    title: '旅行の希望を入力',
    label: '希望を入力',
    rightAction: 'help',
    helpMessage: 'AIが文章から行き先・目的・移動手段を自動で読み取ります。',
  },
  {
    key: 'refine',
    title: '旅行のイメージを調整',
    label: 'イメージ調整',
    rightAction: 'help',
    helpMessage: 'AIが推論した体験タグを調整して、プランをカスタマイズできます。',
  },
  {
    key: 'dest-select',
    title: '目的地を選ぶ',
    label: '目的地選択',
    rightAction: 'help',
    helpMessage: 'より近い場所を選ぶと、CO₂排出量を大幅に削減できます。',
  },
  {
    key: 'intent',
    title: 'AIが意図を整理しました',
    label: '意図を確認',
    rightAction: 'help',
    helpMessage: 'CO₂排出量や体力消耗度はAIによる推定値です。',
  },
  {
    key: 'compare',
    title: '代替プランを比較',
    label: 'プラン比較',
    rightAction: 'menu',
  },
  {
    key: 'eco',
    title: 'さらにエコにする',
    label: 'さらにエコに',
    rightAction: 'help',
    helpMessage: 'エコアクションを選ぶほどポイントが貯まり、CO₂削減に貢献できます。',
  },
  {
    key: 'schedule',
    title: '旅の詳細スケジュール',
    label: 'スケジュール',
    rightAction: 'none',
  },
  {
    key: 'feedback',
    title: '旅行後フィードバック',
    label: 'フィードバック',
    rightAction: 'help',
    helpMessage: '評価は次回のAIの提案に反映されます。',
  },
];

const initialEcoStates: Record<string, boolean> = ECO_ACTIONS.reduce(
  (acc, action) => ({ ...acc, [action.id]: action.defaultOn }),
  {} as Record<string, boolean>,
);

function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [freeText, setFreeText] = useState(DEFAULT_FREE_TEXT);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([...KEYWORD_CHIPS]);
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string>>(
    DEFAULT_SELECTED_CONDITIONS,
  );

  useEffect(() => {
    setSelectedKeywords(extractKeywords(freeText));
  }, [freeText]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Departure location shown top-left on Step 1 and referenced across later steps
  const [departureLocation, setDepartureLocation] = useState(DEFAULT_DEPARTURE_LOCATION);
  const [isDepartureSheetOpen, setIsDepartureSheetOpen] = useState(false);

  // Refinement step states
  const [extractedIntent, setExtractedIntent] = useState<ExtractedIntent | null>(null);
  const [refinedCandidates, setRefinedCandidates] = useState<DestinationCandidate[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('original');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [freeNote, setFreeNote] = useState('');

  // Generated plans states
  const [travelIntent, setTravelIntent] = useState<TravelIntent | null>(null);
  const [allPlans, setAllPlans] = useState<TravelPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comparisonPlans, setComparisonPlans] = useState<TravelPlan[]>([]);
  const [viewingPlan, setViewingPlan] = useState<TravelPlan | null>(null);

  const [ecoActionStates, setEcoActionStates] = useState<Record<string, boolean>>(initialEcoStates);

  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>(DEFAULT_RATINGS);
  const [feedbackComment, setFeedbackComment] = useState(DEFAULT_FEEDBACK_COMMENT);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];

  function flashToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2600);
  }

  function goTo(index: number) {
    setStepIndex(index);
  }

  function handleBack() {
    if (stepIndex > 0) goTo(stepIndex - 1);
  }

  function toggleKeyword(keyword: string) {
    setSelectedKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword],
    );
  }

  // Step 0 -> Step 1 (Fast Intent Extraction)
  async function handleSearchSubmit() {
    setLoading(true);
    setLoadingMessage('AIが旅行の意図を分析しています...');
    try {
      const conditionsWithDeparture = {
        ...selectedConditions,
        departureLabel: departureLocation,
      };
      const extracted = await extractTravelIntent(freeText, selectedKeywords, conditionsWithDeparture);
      setExtractedIntent(extracted);
      setRefinedCandidates([]);
      setSelectedDestinationId('original');
      setSelectedTags(extracted.experienceTags);
      setFreeNote('');
      goTo(1);
    } catch (e) {
      console.error(e);
      flashToast('旅行意図の読み取りに失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  // Step 1 -> Step 2 (Refined Destination Candidates Generation)
  async function handleRefineSubmit() {
    if (!extractedIntent) return;
    setLoading(true);
    setLoadingMessage('AIがご希望に合わせた目的地を探しています...');
    try {
      const conditionsWithDeparture = {
        ...selectedConditions,
        departureLabel: departureLocation,
      };
      const refined = await refineDestinationCandidates(
        extractedIntent.destination,
        selectedTags,
        freeNote,
        conditionsWithDeparture
      );
      setRefinedCandidates(refined);
      setSelectedDestinationId('original');
      goTo(2);
    } catch (e) {
      console.error(e);
      flashToast('目的地候補の再計算に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  // Step 2 -> Step 3 (Full Plan Generation)
  async function handleGeneratePlansSubmit() {
    setLoading(true);
    setLoadingMessage('AIが最適な旅行プランを作成中...\n目的地への乗り換えルートとCO₂排出量を計算しています。約30秒ほどかかります。');
    try {
      // 選択した候補地をLLMに伝える
      const candidatesToSearch = refinedCandidates.length > 0
        ? refinedCandidates
        : (extractedIntent?.candidates || []);
      const selectedCand = candidatesToSearch.find((c) => c.id === selectedDestinationId);
      const destinationOverride = selectedCand?.isAlternative
        ? `\n※ユーザーが目的地として「${selectedCand.name}」（近場エコ候補）を選択しました。この目的地をメインのプランに使ってください。`
        : '';
      const combinedText = `${freeText}\n追加の希望: ${freeNote}${destinationOverride}`;
      const conditionsWithDeparture = {
        ...selectedConditions,
        departureLabel: departureLocation,
      };
      const result = await generateTravelPlans(combinedText, selectedTags, conditionsWithDeparture);
      setTravelIntent(result.intent);
      setAllPlans(result.plans);
      
      const initialCompare = result.plans.filter(
        (p) => p.category === 'original' || p.category === 'recommended'
      );
      setComparisonPlans(initialCompare);
      
      const recommended = result.plans.find((p) => p.category === 'recommended');
      if (recommended) {
        setSelectedPlanId(recommended.id);
      } else if (result.plans.length > 0) {
        setSelectedPlanId(result.plans[0].id);
      }
      
      goTo(3);
    } catch (e) {
      console.error(e);
      flashToast('プランの作成に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  function selectCondition(groupId: string, optionId: string) {
    setSelectedConditions((prev) => ({ ...prev, [groupId]: optionId }));
  }

  // EcoActionSelection support
  function toggleEcoAction(id: string) {
    setEcoActionStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalEcoPoints = ECO_ACTIONS.reduce(
    (sum, action) => sum + (ecoActionStates[action.id] ? action.points : 0),
    0,
  );

  function handleAddToComparison(plan: TravelPlan) {
    setComparisonPlans((prev) => (prev.some((p) => p.id === plan.id) ? prev : [...prev, plan]));
  }

  function handleViewPlanDetail(plan: TravelPlan) {
    setSelectedPlanId(plan.id);
    setViewingPlan(plan);
  }

  // Overlay support
  function handleClosePlanDetail() {
    setViewingPlan(null);
  }

  function handleChangeConditions() {
    setIsDrawerOpen(false);
    goTo(0);
  }

  function handleSubmitFeedback() {
    flashToast(FEEDBACK_TOAST_MESSAGE);
  }

  function handleRightAction() {
    if (currentStep.rightAction === 'menu') {
      setIsDrawerOpen(true);
    } else if (currentStep.rightAction === 'help' && currentStep.helpMessage) {
      flashToast(currentStep.helpMessage);
    }
  }

  const activePlan = allPlans.find((p) => p.id === selectedPlanId) || recommendedPlanFallback();

  function recommendedPlanFallback(): TravelPlan {
    if (comparisonPlans.length > 0) {
      return comparisonPlans.find((p) => p.category === 'recommended') || comparisonPlans[0];
    }
    return RECOMMENDED_PLAN;
  }

  // Calculate CO2 emission reflecting eco action states
  const activePlanWithEco = activePlan ? {
    ...activePlan,
    co2: Math.max(0.5, Math.round((activePlan.co2 * (1 - (totalEcoPoints * 0.005))) * 10) / 10)
  } : RECOMMENDED_PLAN;

  const similarPlansList = allPlans.filter((p) => p.category === 'similar');

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <StatusBar />
        <div className="screen-scroll">
          {currentStep.key === 'input' && (
            <DepartureLocationLink
              departureLocation={departureLocation}
              onClick={() => setIsDepartureSheetOpen(true)}
            />
          )}
          <StepHeader
            stepNumber={stepIndex + 1}
            totalSteps={STEPS.length}
            title={currentStep.title}
            stepLabel={currentStep.label}
            onBack={stepIndex > 0 ? handleBack : undefined}
            rightAction={currentStep.rightAction}
            onRightActionClick={handleRightAction}
          />

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              padding: 24,
              textAlign: 'center'
            }}>
              <div className="loading-spinner" style={{
                width: 40,
                height: 40,
                border: '4px solid rgba(16, 185, 129, 0.1)',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: 16
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{ fontWeight: 'bold', color: '#111827', whiteSpace: 'pre-line' }}>{loadingMessage}</p>
            </div>
          ) : (
            <>
              {currentStep.key === 'input' && (
                <NaturalLanguageInput
                  freeText={freeText}
                  onFreeTextChange={setFreeText}
                  selectedKeywords={selectedKeywords}
                  onToggleKeyword={toggleKeyword}
                  selectedConditions={selectedConditions}
                  onSelectCondition={selectCondition}
                  onSubmit={handleSearchSubmit}
                />
              )}

              {currentStep.key === 'refine' && extractedIntent && (
                <IntentRefinement
                  extracted={extractedIntent}
                  selectedTags={selectedTags}
                  onToggleTag={(tag) =>
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  freeNote={freeNote}
                  onFreeNoteChange={setFreeNote}
                  onSubmit={handleRefineSubmit}
                />
              )}

              {currentStep.key === 'dest-select' && extractedIntent && (
                <DestinationSelect
                  candidates={refinedCandidates.length > 0 ? refinedCandidates : (extractedIntent.candidates || [])}
                  selectedId={selectedDestinationId}
                  onSelect={setSelectedDestinationId}
                  loading={loading}
                  onSubmit={handleGeneratePlansSubmit}
                />
              )}

              {currentStep.key === 'intent' && (
                <IntentExtraction
                  intent={travelIntent || TRAVEL_INTENT}
                  departureLocation={departureLocation}
                  onSubmit={() => goTo(4)}
                />
              )}

              {currentStep.key === 'compare' && (
                <PlanComparison
                  plans={comparisonPlans.length > 0 ? comparisonPlans : [ORIGINAL_PLAN, RECOMMENDED_PLAN]}
                  departureLocation={departureLocation}
                  onViewDetail={handleViewPlanDetail}
                  onSubmit={() => goTo(5)}
                />
              )}

              {currentStep.key === 'eco' && (
                <EcoActionSelection
                  actionStates={ecoActionStates}
                  onToggle={toggleEcoAction}
                  totalPoints={totalEcoPoints}
                  onSubmit={() => goTo(6)}
                />
              )}

              {currentStep.key === 'schedule' && (
                <DetailedSchedule
                  plan={activePlanWithEco}
                  departureLocation={departureLocation}
                  footer={
                    <button className="primary-button" onClick={() => goTo(7)}>
                      旅行後フィードバックへ
                    </button>
                  }
                />
              )}

              {currentStep.key === 'feedback' && (
                <FeedbackForm
                  ratings={feedbackRatings}
                  onRatingChange={(id, value) =>
                    setFeedbackRatings((prev) => ({ ...prev, [id]: value }))
                  }
                  comment={feedbackComment}
                  onCommentChange={setFeedbackComment}
                  onSubmit={handleSubmitFeedback}
                />
              )}
            </>
          )}
        </div>

        <SimilarPlanDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          plans={similarPlansList.length > 0 ? similarPlansList : SIMILAR_PLANS}
          addedPlanIds={new Set(comparisonPlans.map((p) => p.id))}
          onAddToComparison={handleAddToComparison}
          onChangeConditions={handleChangeConditions}
        />

        <PlanDetailOverlay plan={viewingPlan} onClose={handleClosePlanDetail} />

        <DepartureLocationSheet
          open={isDepartureSheetOpen}
          currentValue={departureLocation}
          onSelect={(value) => {
            setDepartureLocation(value);
            setIsDepartureSheetOpen(false);
          }}
          onClose={() => setIsDepartureSheetOpen(false)}
        />

        {toastMessage && <Toast message={toastMessage} />}
      </div>
    </div>
  );
}

export default App;
