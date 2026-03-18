import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Users, FileText, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Lightbulb className="h-8 w-8 text-blue-500" />,
    title: "창의적인 아이디어를 절대 놓치지 마세요",
    description: "모든 브레인스토밍, 모든 창의성의 불꽃을 포착하세요. AI가 여러분의 세션을 전사하여 뛰어난 아이디어가 절대 빠져나가지 않도록 합니다.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "다국어 팀 협업",
    description: "다양한 언어를 사용하는 창의적인 팀과 원활하게 작업하세요. 실시간 전사는 130개 이상의 언어를 지원하여 진정한 글로벌 협업을 가능하게 합니다.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "자동 회의 문서화",
    description: "창의적인 흐름에 집중하는 동안 저희가 노트를 처리합니다. 모든 캠페인 검토 및 아이디어 세션에 대해 화자 식별 전사본을 받으세요.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "검색 가능한 크리에이티브 아카이브",
    description: "창의적 결정의 지식 베이스를 구축하세요. 과거 브레인스토밍을 쉽게 검색하여 몇 달 전에 논의한 완벽한 개념을 찾으세요.",
  },
];

const faqItems = [
  {
    question: "창의적인 브레인스토밍 세션에 어떻게 도움이 되나요?",
    answer: "브레인스토밍 중에는 아이디어가 빠르게 흐릅니다. Dicta-Notes는 모든 제안과 개념을 자동으로 포착하여 팀이 노트 작성에 대해 걱정하지 않고 창의적인 흐름을 유지할 수 있도록 합니다. 나중에 전체 전사본을 검토하여 최고의 아이디어를 식별하세요."
  },
  {
    question: "고객 프레젠테이션 및 피드백 세션에 사용할 수 있나요?",
    answer: "물론입니다! 고객 회의, 디자인 비평 및 피드백 세션을 녹음하세요. 고객 요청, 창의적 방향 및 승인 결정에 대한 정확한 기록을 갖게 됩니다 - 참조 및 책임성에 완벽합니다."
  },
  {
    question: "다국어 팀은 어떻게 하나요?",
    answer: "Dicta-Notes는 화자 식별과 함께 130개 이상의 언어를 지원합니다. 창의적인 팀이 여러 국가에 걸쳐 있다면 모두가 선호하는 언어로 참여할 수 있으며 전사본이 모든 것을 포착합니다."
  },
  {
    question: "창의적인 콘텐츠는 얼마나 안전한가요?",
    answer: "모든 전사본은 암호화되어 Firebase 인프라를 통해 안전하게 저장됩니다. 창의적 개념, 캠페인 아이디어 및 고객 논의는 기밀로 보호됩니다."
  }
];

export default function MarketingKo() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing KO Page', { language: 'ko', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ko');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ko" />
        <title>마케팅 팀을 위한 Dicta-Notes | 크리에이티브를 위한 AI 전사</title>
        <meta name="description" content="마케팅 팀과 크리에이티브 전문가를 위한 AI 기반 전사. 브레인스토밍 세션에서 뛰어난 아이디어를 절대 놓치지 마세요. 캠페인 계획, 디자인 리뷰 및 다국어 협업에 완벽합니다." />
        <meta name="keywords" content="마케팅 전사, 크리에이티브 팀 회의, 브레인스토밍 문서화, 캠페인 계획 노트, 디자인 리뷰 전사, 다국어 마케팅 팀" />
        <link rel="canonical" href="https://dicta-notes.com/marketing-ko" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="마케팅 & 크리에이티브 팀을 위한 Dicta-Notes" />
        <meta property="og:description" content="브레인스토밍, 캠페인 계획 및 크리에이티브 리뷰를 위한 AI 전사. 다시는 훌륭한 아이디어를 놓치지 마세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing-ko" />
        <meta property="og:locale" content="ko_KR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "마케팅 팀을 위한 Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ko",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "마케팅 및 크리에이티브 팀을 위한 AI 기반 회의 전사. 130개 이상의 언어로 화자 식별을 통해 브레인스토밍 세션, 캠페인 계획 및 디자인 리뷰를 캡처하세요.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "마케팅 및 크리에이티브 전문가"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            모든 창의적 불꽃을 포착하세요
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes는 브레인스토밍 세션과 창의적 회의를 검색 가능하고 실행 가능한 문서로 변환합니다. AI가 노트를 처리하는 동안 혁신에 집중하세요.
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
            <h2 className="text-3xl font-bold">뛰어난 아이디어가 빠져나가고 있나요?</h2>
            <p className="text-muted-foreground mt-4">
              빠른 속도의 창의적 세션은 놀라운 개념을 생성하지만 수동 노트 작성은 추진력을 죽이고 훌륭한 아이디어는 흩어진 노트 속에서 사라집니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>잃어버린 창의적 아이디어</CardTitle>
              </CardHeader>
              <CardContent>
                <p>격렬한 브레인스토밍 중에는 항상 누군가 노트를 작성하느라 애쓰고 있습니다. 아무도 제대로 포착하지 못했기 때문에 훌륭한 개념이 사라집니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>흩어진 문서</CardTitle>
              </CardHeader>
              <CardContent>
                <p>캠페인 결정과 창의적 방향이 무작위 노트북, 불완전한 구글 문서 또는 더 나쁘게는 사람들의 기억 속에만 남아 있습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>언어 장벽</CardTitle>
              </CardHeader>
              <CardContent>
                <p>글로벌 크리에이티브 팀은 회의에서 여러 언어가 섞일 때 모든 사람의 기여를 정확하게 포착하기 어려워합니다.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">창의적 흐름을 위해 구축됨</h2>
            <p className="text-muted-foreground mt-2">
              아이디어를 잃지 않고 빠르게 움직여야 하는 마케팅 팀과 크리에이티브 전문가를 위해 설계되었습니다.
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

        {/* Use Case Scenarios */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">창의적 워크플로에 완벽함</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>캠페인 브레인스토밍</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>캠페인 아이디어 도출 중 모든 개념, 태그라인 및 창의적 방향을 포착하세요. 전체 전사본을 검토하여 최고의 아이디어를 선별하고 포괄적인 브리프를 작성하세요.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>디자인 비평</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>디자인 리뷰의 모든 피드백을 문서화하세요. 무엇이 효과가 있었고 없었는지, 창의적 결정 뒤의 이유를 명확하게 기록하세요.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>고객 프레젠테이션</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>고객 피드백 세션을 기록하여 아무것도 놓치지 않도록 하세요. 수정, 승인 및 범위 논의에 대한 정확한 참조를 갖추세요.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>콘텐츠 계획</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>전략 회의를 검색 가능한 콘텐츠 캘린더로 전환하세요. "누가 그 주제를 제안했지?" 또는 "우리가 논의한 각도는 무엇이었지?"라고 궁금해하지 마세요.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">크리에이티브 팀의 질문</h2>
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
        <section className="py-20 px-4 text-center bg-purple-600 text-white">
          <h2 className="text-3xl font-bold">다시는 훌륭한 아이디어를 놓치지 않을 준비가 되셨나요?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            AI 전사를 사용하여 최고의 아이디어를 포착하고 정리하고 실행하는 전 세계 크리에이티브 팀에 합류하세요.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              지금 무료 체험 시작
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              가격 보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
