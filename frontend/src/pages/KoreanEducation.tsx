import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Accessibility, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Accessibility className="h-8 w-8 text-blue-500" />,
    title: "모든 학생을 위한 접근성",
    description: "모든 강의에 대한 정확한 필기록을 제공하여 규정 준수를 지원하고 청각 장애가 있는 학생을 포함한 모든 학생이 콘텐츠에 액세스할 수 있도록 합니다.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "강의를 학습 도구로 전환",
    description: "학생들은 긴 강의 녹음을 검색 가능하고 인용 가능한 텍스트로 변환하여 공부, 논문 작성 및 핵심 개념 복습을 쉽게 할 수 있습니다.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "자동 강의 캡처",
    description: "대면이든 온라인이든 모든 수업을 녹음하고 AI가 노트 작성을 처리하도록 합니다. 모든 수업의 영구적이고 정확한 아카이브를 만듭니다.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "유학생에게 이상적",
    description: "130개 이상의 언어로 실시간 번역을 지원하는 다국어 지원 - 국제 대학과 외국인 학생에게 완벽합니다.",
  },
];

const faqItems = [
  {
    question: "이것이 우리 기관의 접근성 요구 사항을 충족하는 데 어떻게 도움이 됩니까?",
    answer: "강의 및 강좌 자료의 정확하고 타임스탬프가 있는 필기록을 제공함으로써 청각 장애 및 기타 학습 요구가 있는 학생에게 공평한 대안을 제공합니다."
  },
  {
    question: "교수들이 사용하기 복잡합니까?",
    answer: "전혀 그렇지 않습니다. 프로세스는 간단합니다. 녹음을 시작하면 우리가 나머지를 처리합니다. 최소한의 기술 능력만 필요하며 강사가 기술이 아닌 교육에 집중할 수 있습니다."
  },
  {
    question: "학생들이 자체 스터디 그룹에 사용할 수 있습니까?",
    answer: "물론입니다. 학생들은 Dicta-Notes를 사용하여 스터디 세션, 그룹 프로젝트 및 복습 토론을 녹음하고 필기하여 공유 지식 저장소를 만들 수 있습니다."
  },
  {
    question: "필기록을 어떤 형식으로 내보낼 수 있습니까?",
    answer: "필기록을 PDF, Word, 일반 텍스트 및 Markdown으로 내보낼 수 있어 학습 관리 시스템(LMS)에 공유, 보관 및 통합하기 쉽습니다."
  }
];

export default function KoreanEducation() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Korean Education Page', { language: 'ko', niche: 'education' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ko');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ko" />
        <title>Dicta-Notes 교육용 | AI 강의 필기</title>
        <meta name="description" content="교육을 위한 AI 필기 솔루션. 강의와 세미나를 검색 가능한 노트로 변환하세요. 학생, 교수, 대학에 완벽합니다. 유학생을 위한 다국어 지원." />
        <link rel="canonical" href="https://dicta-notes.com/korean-education" />
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags for education pages */}
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean-education" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french-education" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish-education" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german-education" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/greek-education" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/education" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes 교육용 | 강의 필기" />
        <meta property="og:description" content="강의, 세미나, 스터디 그룹을 위한 AI 필기. 접근 가능하고, 다국어 지원, 사용하기 쉬움." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/korean-education" />
        <meta property="og:locale" content="ko_KR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes 교육용",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "inLanguage": "ko",
            "url": "https://dicta-notes.com/korean-education",
            "@id": "https://dicta-notes.com/korean-education",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI를 이용한 실시간 강의 필기. 화자 식별 기능으로 강의를 검색 가능한 노트로 변환. 유학생을 위한 130개 이상의 언어 지원.",
            "audience": {
              "@type": "EducationalAudience",
              "educationalRole": "student"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            모든 학생에게 접근 가능한 학습 제공
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes는 강의를 정확하고 검색 가능한 필기록으로 변환합니다. 접근성을 개선하고 규정 준수를 지원하며 학생들에게 성공을 위한 강력한 도구를 제공하십시오.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              무료로 시작하기
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 팁: 앱 번역</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  "무료로 시작하기"를 클릭하고 앱에 접속하면 인터페이스가 영어로 되어 있을 수 있습니다. 페이지 상단 헤더에 있는 번역 버튼(지구본 아이콘 🌐)을 클릭하여 쉽게 한국어(또는 130개 이상의 언어 중 하나)로 번역할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">학생들이 따라가는 데 어려움을 겪고 있습니까?</h2>
            <p className="text-muted-foreground mt-4">
              수동 노트 작성은 비효율적이며 다양한 학습 요구를 가진 학생에게 장벽을 만듭니다. 강의가 끝나는 순간 귀중한 정보가 손실됩니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>접근 불가능한 콘텐츠</CardTitle>
              </CardHeader>
              <CardContent>
                <p>청각 기반 강의는 청각 장애 학생을 배제하며 현대 접근성 표준을 충족하지 못합니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>비효율적인 학습</CardTitle>
              </CardHeader>
              <CardContent>
                <p>학생들은 자료에 집중하기보다 노트를 끄적이는 데 더 많은 시간을 보내 수동적 학습과 잊힌 세부 사항으로 이어집니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>복습 자료 부족</CardTitle>
              </CardHeader>
              <CardContent>
                <p>강의가 끝나면 학생들이 특정 개념을 복습하거나 놓친 부분을 명확히 할 쉬운 방법이 없습니다.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">모두를 위한 더 스마트한 교실</h2>
            <p className="text-muted-foreground mt-2">
              접근 가능하고 효과적인 학습을 중요시하는 교육자와 학생을 위해 구축되었습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">교육자의 질문</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center bg-indigo-600 text-white">
          <h2 className="text-3xl font-bold">오늘 더 포용적인 학습 환경을 만드세요</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            교육을 더 접근 가능하고 효과적으로 만드는 선도적인 기관에 참여하십시오. AI 기반 강의 필기를 시작하십시오.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              무료 체험 시작
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              플랜 보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
