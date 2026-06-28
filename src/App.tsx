import { useState } from 'react';
import StepHeader from './components/StepHeader';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';
import NaturalLanguageInput from './components/NaturalLanguageInput';
import IntentExtraction from './components/IntentExtraction';
import PlanComparison from './components/PlanComparison';
import SimilarPlanDrawer from './components/SimilarPlanDrawer';
import PlanDetailOverlay from './components/PlanDetailOverlay';
import EcoActionSelection from './components/EcoActionSelection';
import DetailedSchedule from './components/DetailedSchedule';
import FeedbackForm from './components/FeedbackForm';
import {
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
import type { TravelPlan } from './types';

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
    label: '旅行の希望を入力',
    rightAction: 'help',
    helpMessage: 'AIが文章から行き先・目的・移動手段を自動で読み取ります。',
  },
  {
    key: 'intent',
    title: 'AIが意図を整理しました',
    label: 'AIが意図を整理',
    rightAction: 'help',
    helpMessage: 'CO₂排出量や体力消耗度はAIによる推定値です。',
  },
  {
    key: 'compare',
    title: '代替プランを比較',
    label: '代替プランを比較',
    rightAction: 'menu',
  },
  {
    key: 'eco',
    title: 'さらにエコにする',
    label: 'さらにエコにする',
    rightAction: 'help',
    helpMessage: 'エコアクションを選ぶほどポイントが貯まり、CO₂削減に貢献できます。',
  },
  {
    key: 'schedule',
    title: '旅の詳細スケジュール',
    label: '旅の詳細スケジュール',
    rightAction: 'none',
  },
  {
    key: 'feedback',
    title: '旅行後フィードバック',
    label: '旅行後フィードバック',
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comparisonPlans, setComparisonPlans] = useState<TravelPlan[]>([
    ORIGINAL_PLAN,
    RECOMMENDED_PLAN,
  ]);
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

  function selectCondition(groupId: string, optionId: string) {
    setSelectedConditions((prev) => ({ ...prev, [groupId]: optionId }));
  }

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
    setViewingPlan(plan);
  }

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

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <StatusBar />
        <div className="screen-scroll">
          <StepHeader
            stepNumber={stepIndex + 1}
            totalSteps={STEPS.length}
            title={currentStep.title}
            stepLabel={currentStep.label}
            onBack={stepIndex > 0 ? handleBack : undefined}
            rightAction={currentStep.rightAction}
            onRightActionClick={handleRightAction}
          />

          {currentStep.key === 'input' && (
            <NaturalLanguageInput
              freeText={freeText}
              onFreeTextChange={setFreeText}
              selectedKeywords={selectedKeywords}
              onToggleKeyword={toggleKeyword}
              selectedConditions={selectedConditions}
              onSelectCondition={selectCondition}
              onSubmit={() => goTo(1)}
            />
          )}

          {currentStep.key === 'intent' && (
            <IntentExtraction intent={TRAVEL_INTENT} onSubmit={() => goTo(2)} />
          )}

          {currentStep.key === 'compare' && (
            <PlanComparison
              plans={comparisonPlans}
              onViewDetail={handleViewPlanDetail}
              onSubmit={() => goTo(3)}
            />
          )}

          {currentStep.key === 'eco' && (
            <EcoActionSelection
              actionStates={ecoActionStates}
              onToggle={toggleEcoAction}
              totalPoints={totalEcoPoints}
              onSubmit={() => goTo(4)}
            />
          )}

          {currentStep.key === 'schedule' && (
            <DetailedSchedule
              plan={RECOMMENDED_PLAN}
              footer={
                <button className="primary-button" onClick={() => goTo(5)}>
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
        </div>

        <SimilarPlanDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          plans={SIMILAR_PLANS}
          addedPlanIds={new Set(comparisonPlans.map((p) => p.id))}
          onAddToComparison={handleAddToComparison}
          onChangeConditions={handleChangeConditions}
        />

        <PlanDetailOverlay plan={viewingPlan} onClose={handleClosePlanDetail} />

        {toastMessage && <Toast message={toastMessage} />}
      </div>
    </div>
  );
}

export default App;
