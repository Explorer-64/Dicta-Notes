import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Archive, Search, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Clock className="h-8 w-8 text-blue-500" />,
    title: "비동기 작업 수용",
    description: "상태 업데이트 회의를 검색 가능한 요약된 전사로 대체하세요. 시간대에 관계없이 모두를 최신 상태로 유지하세요.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "검색 가능한 팀 메모리",
    description: "모든 대화가 팀의 집단 지식 베이스의 일부가 됩니다. 주요 결정, 마감일 및 실행 항목을 즉시 찾으세요.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "자동 회의 노트",
    description: "Gemini 2.5 Pro로 구동되는 화자 식별 세부 노트를 받으세요. 대화에 집중하고 노트 작성은 하지 마세요.",
  },
];

const faqItems = [
  {
    question: "이것이 회의 피로를 줄이는 데 어떻게 도움이 되나요?",
    answer: "신뢰할 수 있고 상세한 전사를 제공함으로써 상태 업데이트 회의를 자신 있게 건너뛸 수 있습니다. 팀원들은 자신의 시간에 따라잡을 수 있어 더 적고 집중된 라이브 세션으로 이어집니다."
  },
  {
    question: "프로젝트 관리 도구와 통합할 수 있나요?",
    answer: "아직 직접 통합은 없지만 다양한 형식(텍스트, 마크다운, 워드)으로 전사를 쉽게 내보내 Asana, Jira 또는 Trello와 같은 도구에 실행 항목과 요약을 복사-붙여넣기 할 수 있습니다."
  },
  {
    question: "브라우저 음성과 최종 전사의 차이점은 무엇인가요?",
    answer: "녹음 중에 보이는 라이브 텍스트는 즉각적인 UX 피드백을 위한 것입니다. 최종 고정밀 전사는 최대 품질과 신뢰성을 위해 저장된 오디오에서 Gemini 2.5 Pro에 의해 처리됩니다."
  },
  {
    question: "기밀 내부 토론에 적합한가요?",
    answer: "예. Firebase의 안전한 인프라를 사용하여 데이터가 암호화되고 보호되도록 합니다. 대부분의 비즈니스 커뮤니케이션을 위한 안전한 솔루션이지만 HIPAA를 준수하지는 않습니다."
  }
];

export default function RemoteTeamsKo() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams KO Page', { language: 'ko', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ko');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ko" />
        <title>원격 팀을 위한 Dicta-Notes | 분산 팀을 위한 AI 전사</title>
        <meta name="description" content="원격 및 분산 팀을 위한 AI 기반 회의 전사. 회의 피로를 줄이고, 비동기 협업을 가능하게 하며, 시간대를 넘어 검색 가능한 지식 베이스를 구축하세요." />
        <meta name="keywords" content="원격 팀 전사, 분산 팀 회의, 비동기 회의 노트, 시간대 협업, 원격 작업 문서, 분산 팀 생산성" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams-ko" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="원격 팀을 위한 Dicta-Notes" />
        <meta property="og:description" content="분산 팀을 위한 AI 회의 전사. 자동 회의 노트로 시간대를 넘어 비동기 협업을 가능하게 합니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams-ko" />
        <meta property="og:locale" content="ko_KR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "원격 팀을 위한 Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ko",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "원격 및 분산 팀을 위한 AI 기반 회의 전사. 회의 피로를 줄이고, 비동기 협업을 가능하게 하며, 130개 이상의 언어로 화자 식별을 통해 시간대를 넘어 검색 가능한 문서를 구축하세요.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "원격 및 분산 팀"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            더 많은 생산성, 회의 시간 감소
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes는 AI로 전사된 회의를 통해 원격 팀에게 비동기 커뮤니케이션의 힘을 제공합니다. 모든 대화를 실행 가능하고 검색 가능한 문서로 전환하세요.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              무료 체험 시작
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 팁: 앱 번역하기</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  "무료 체험 시작"을 클릭하고 앱에 액세스하면 인터페이스가 영어로 되어 있을 수 있습니다. 페이지 상단 헤더에 있는 번역 버튼(지구본 아이콘 🌐)을 클릭하여 한국어(또는 130개 이상의 언어 중 하나)로 쉽게 번역할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">분산 팀이 회의에 빠져 있나요?</h2>
            <p className="text-muted-foreground mt-4">
              시간대를 넘어 조정하는 것은 종종 회의 과부하, 정보 사일로 및 생산성을 죽이는 끝없는 상태 업데이트로 이어집니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>회의 피로</CardTitle>
              </CardHeader>
              <CardContent>
                <p>연속적인 화상 통화는 심층 작업 시간을 남기지 않습니다. 중요한 대화는 서두르고 팀원들은 참여하지 않습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>정보 사일로</CardTitle>
              </CardHeader>
              <CardContent>
                <p>회의에서 내린 주요 결정은 통화가 끝나자마자 사라져 참석할 수 없었던 사람들에게는 사용할 수 없습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>시간대 충돌</CardTitle>
              </CardHeader>
              <CardContent>
                <p>팀원들은 이른 아침이나 늦은 밤 통화에 강제로 참여하게 되어 번아웃과 불평등한 참여로 이어집니다.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">더 스마트하게 일하세요, 더 힘들게 하지 말고</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes는 현대적이고 비동기 우선 원격 팀을 위해 구축되었습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
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
            <h2 className="text-3xl font-bold text-center mb-8">질문에 대한 답변</h2>
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
        <section className="py-20 px-4 text-center bg-green-600 text-white">
          <h2 className="text-3xl font-bold">팀의 시간을 되찾을 준비가 되셨나요?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            분산 팀이 어디서든, 언제든 효과적으로 소통할 수 있는 도구를 제공하세요.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              지금 무료 체험 시작
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              가격 보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
