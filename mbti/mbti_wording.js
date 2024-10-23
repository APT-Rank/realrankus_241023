var mbti_result_des = {
    "INTJ" : "용의주도한 전략가",
    "INTP" : "논리적인 사색가",
    "ENTJ" : "대담한 통솔자",
    "ENTP" : "뜨거운 논쟁을 즐기는 변론가",

    "INFJ" : "선의의 옹호자",
    "INFP" : "열정적인 중재자",
    "ENFJ" : "정의로운 사회활동가",
    "ENFP" : "재기발랄한 활동가",

    "ISTJ" : "청렴결백한 논리주의자",
    "ISFJ" : "용감한 수호자",
    "ESTJ" : "엄격한 관리자",
    "ESFJ" : "사교적인 외교관",

    "ISTP" : "만능 재주꾼",
    "ISFP" : "호기심 많은 예술가",
    "ESTP" : "모험을 즐기는 사업가",
    "ESFP" : "자유로운 영혼의 연예인",
}

var mbti_result_comment = {
    "INTJ" : 
    {
        "comment1" :
        "최고가 되는 것은 외로운 일입니다. 매우 희귀한 성격이면서도 뛰어난 능력을 지닌 전략가(INTJ)는 이러한 말의 의미를 잘 알고 있습니다.\
        전략가는 이성적이면서도 두뇌 회전이 빠른 성격으로, 자신의 뛰어난 사고 능력을 자랑스러워하며 거짓말과 위선을 꿰뚫어 보는 능력이 있습니다.\
        하지만 이로 인해 끊임없이 생각하고 주변의 모든 것을 분석하려는 자신의 성향을 이해할 수 있는 사람을 찾는 데 어려움을 겪기도 합니다.",
        
        "comment2" :
        "전략가는 조용히 사색을 하며 상황을 판단하고, 때로는 깊은 외로움을 스스로 선택하며 풀리지 않던 문제에 무한히 집중하기도 합니다.\
        INTJ 성향으로 용의주도한 전략가인 당신께는 외롭지만 <span class='focusOn'>사색하기 좋은 주거 환경</span>과 사고 능력을 충분히 발휘할 수 있는 <span class='focusOn'>교육 환경이 우수한 단지</span>가 어울립니다."
    },

    "INTP" :
    {
        "comment1" :
        "논리술사(INTP)는 자신의 독특한 관점과 활기 넘치는 지성에 자부심을 느끼며, 우주의 미스터리에 대해 깊이 생각하곤 합니다.\
        유명한 철학자와 과학자 중 논리술사 성격이 많은 것도 이 때문일 것입니다.\
        논리술사는 상당히 희귀한 성격이지만 뛰어난 창의성과 독창성으로 많은 사람 사이에서 존재감을 드러내곤 합니다.",
        
        "comment2" :
        "논리적이면서 창의적이기는 매우 어렵습니다. 그런데 당신은 그 모든 것을 갖춘 사람이네요.\
        스스로의 창의성에 몰입하는 당신은 외로움을 타지는 않지만, <span class='focusOn'>집중할 수 있는 쾌적하고 안정적인 주거 환경</span>과,\
        언제든 궁금점을 찾아볼 수 있는 <span class='focusOn'>융통성 있는 교육환경</span>이 필요해 보이네요. 그렇다고 도서관 같은 중요한 인프라가 빠질 수는 없겠죠?"
    },    
    

    "ENTJ" :
    {
        "comment1" :
        "통솔자(ENTJ)는 타고난 리더라고 할 수 있습니다.\
        이들은 카리스마와 자신감을 지니고 있으며 자신의 권한을 이용해 사람들이 공통된 목표를 위해 함께 노력하도록 이끕니다.\
        또한 이들은 냉철한 이성을 지닌 것으로 유명하며 자신이 원하는 것을 성취하기 위해 열정과 결단력과 날카로운 지적 능력을 활용합니다.\
        이들은 전체 인구의 3%에 불과하지만, 다른 많은 성격을 압도하는 존재감을 뽐내며 다양한 비즈니스와 단체를 이끄는 역할을 할 때가 많습니다.",
        
        "comment2" :
        "강력한 리더쉽을 가진 당신은 사람들의 선망의 대상이 되기도 하지만, 때로는 시기와 질투의 대상이 되기도 합니다.\
        그럼에도 불구하고 자신만의 뚜렷한 목표의식과 끈기있는 돌파로 실패를 거듭해도 반드시 해내고 마는 사람입니다.\
        많은 사람을 이끌어갈 수 있도록 <span class='focusOn'>세대수가 많은 대단지</span>와 주변 <span class='focusOn'>환경을 적극적으로 활용할 수 있는 인프라</span>가 잘 구축된 단지가 매우 어울리네요."        
    },    

    "ENTP" :
    {
        "comment1" :
        "변론가(ENTP)는 두뇌 회전이 빠르고 대담한 성격으로 현재 상황에 이의를 제기하는 데 거리낌이 없습니다.\
        변론가는 어떤 의견이나 사람에 반대하는 일을 두려워하지 않으며, 논란이 될 만한 주제에 대해 격렬하게 논쟁하는 일을 즐깁니다.\
        그렇다고 변론가가 반론을 제기하는 데만 관심이 있거나 악의를 지닌 것은 아닙니다.\
        사실 변론가는 지식이 풍부하고 호기심이 넘치며 활기찬 유머 감각으로 다른 사람을 즐겁게 할 수 있는 성격입니다.\
        다만 대부분의 성격과 달리 논쟁에서 즐거움을 찾는 성향이 있을 뿐입니다.",
        
        "comment2" :
        "어떠한 상황에서도 빠른 판단력과 특유의 논리정연함으로 토론의 중심에 설 수 있는 당신은 '달변'이라는 호칭도 많이 듣겠군요.\
        상황에 대한 판단이 워낙 빠르기 때문에 대응도 매우 빠른 편입니다. 다른 사람이 생각할 시간 동안 당신은 다음 단계의 대응을 준비하고 있겠네요.\
        빠른 대응을 위해 <span class='focusOn'>주변의 인프라 요소가 잘 갖추어진 곳</span>과, 이동이 용이한 <span class='focusOn'>교통 요충지</span>가 매우 어울립니다."
    },

    "INFJ" :
    {
        "comment1" :
        "옹호자(INFJ)는 매우 희귀한 성격임에도 불구하고 세상에 큰 영향력을 발휘하곤 합니다.\
        이들은 이상주의적이고 원칙주의적인 성격으로, 삶에 순응하는 대신 삶에 맞서 변화를 만들어 내고자 합니다.\
        이들에게 성공이란 돈이나 지위가 아니라 자아를 실현하고 다른 사람을 도우며 세상에서 선을 실천하는 일입니다.",
        
        "comment2" :
        "선한 영향력을 발휘하는 당신은, 모두가 만나고 싶어하고 함께 있고 싶어하지만\
        스스로는 조용한 시간을 즐기는 사색가의 면모를 함께 가지고 있습니다.\
        선한 영향력은 때로 그 확장을 시기하고 질투하는 사람들에 의해 모함을 받는 경우가 많을텐데요,\
        <span class='focusOn'>마음을 다스리는 평안한 주거환경</span>과 <span class='focusOn'>주변이 조용한 교육환경</span>이 좋은 단지가 어울립니다."
    },

    "INFP" :
    {
        "comment1" :
        "중재자(INFP)는 언뜻 보기에 조용하고 자신을 내세우지 않는 것처럼 보이지만, 사실은 에너지와 열정이 넘치는 마음을 지닌 성격입니다.\
        이들은 창의적이고 상상력이 뛰어나며 몽상을 즐기는 성격으로 머릿속에서 수많은 이야기를 만들어 내곤 합니다.\
        또한 음악과 예술과 자연에 대한 감수성이 뛰어나며 다른 사람의 감정을 빠르게 알아차립니다.\
        중재자는 이상주의적이고 공감 능력이 높으며 깊고 의미 있는 관계를 원하고 다른 사람을 도와야 한다는 사명감을 느끼곤 합니다.",
        
        "comment2" :
        "조용하고 드러나지 않아 보이는 당신이지만 혼자 또는 소수의 몇 명이서는 열정적으로 즐기고 놀 줄 아는 사람입니다.\
        혼자 또는 소수의 돈독한 친구와 함께하는 시간을 보내기 위해 <span class='focusOn'>쾌적한 주거 환경이 갖추어진 단지</span>와\
        소통으로 어려움을 겪는 주변의 사람들과 대화할 수 있는 <span class='focusOn'>조용한 커피숍 환경의 인프라 단지</span>가 매우 어울리네요."
    },    

    "ENFJ" :
    {
        "comment1" :
        "선도자(ENFJ)는 삶에서 위대한 사명을 위해 힘써야 한다는 느낌을 받곤 합니다.\
        사려 깊고 이상주의적 성향을 지닌 선도자는 다른 사람과 주변 세상에 긍정적인 영향력을 발휘하기 위해 최선을 다하며,\
        어려운 상황에서도 올바른 일을 할 기회를 마다하지 않습니다.\
        선도자는 타고난 지도자라고 할 수 있으며 많은 선도자가 정치인, 코치, 교사로 활동하고 있습니다.",
        
        "comment2" :
        "원대한 꿈을 꾸면서 세상에 긍정적인 영향을 만들어내고 싶어 하는 당신은, 많은 사람들을 독려하며 솔선수범하는 사람이네요.\
        강력한 카리스마로 저돌적인 리더에 가까운 ENTJ와는 사뭇 다르게 부드러운 리더쉽을 발휘함으로 멘토 역할을 주로 하게 됩니다.\
        <span class='focusOn'>코칭과 멘토링이 필요한 교육과 인프라가 갖추어진 곳</span>에서 활동하는 리더의 모습이 보여지네요."
    },

    "ENFP" :
    {
        "comment1" :
        "활동가(ENFP)는 진정으로 자유로운 영혼이라고 할 수 있으며 외향적이고 솔직하며 개방적인 성격입니다.\
        이들은 활기차고 낙관적인 태도로 삶을 대하며 다른 사람들 사이에서 돋보이곤 합니다.\
        그러나 신나는 인생을 보내는 것처럼 보인다고 해서 즐거움만을 좇는 성격은 아니며, 다른 사람과 감정적으로 깊고 의미 있는 관계를 맺는 일을 추구합니다.",
        
        "comment2" :
        "당신은 새로운 경험을 좋아하고, 변화에 잘 적응하는 편이기 때문에 생활의 활기와 다채로운 활동을 즐길 수 있는 환경이 적합하네요.\
        특히 다른 곳으로 이동하여 다양한 활동에 참여하면서 모험심과 호기심을 만족시킬 필요가 있고요, 다양한 문화 활동, 예술 행사, 그리고 커뮤니티 이벤트에 쉽게 접근할 수 있어야 해요.\
        결론적으로 <span class='focusOn'>교통과 인프라가 잘 갖추어진 단지</span>가 매우 어울리네요."
    },
    
    "ISTJ" :
    {
        "comment1" :
        "현실주의자(ISTJ)는 진솔하게 행동하는 자신의 모습에서 자부심을 느끼며, 자기 생각을 솔직하게 이야기하고 어떤 것에 헌신하기로 한 경우 최선을 다합니다.\
        화려한 삶이나 다른 사람의 주의를 끄는 일에는 관심이 없으며 안정된 사회를 위해 자신의 몫보다 많은 기여를 하곤 합니다.\
        이들은 가족이나 주변 사람들로부터 믿음직한 사람이라는 평판을 받을 때가 많으며, 현실 감각이 뛰어나 스트레스가 극심한 상황에서도 현실적이고 논리적인 태도를 유지하는 사람으로 인정받곤 합니다.",
        
        "comment2" :
        "당신은 창의적이고 열정적인 면모가 강하지만, 동시에 현실주의적인 성향도 지니고 있어 안정성을 중요시하네요.\
        따라서 <span class='focusOn'>안정적인 교육 환경</span>을 통해 당신이 가지는 지적 호기심과 학습 욕구를 충족시키고, <span class='focusOn'>안정적인 주거환경</span>을 통해 안전하고 평온한 기반을 마련하는 것이\
        창의성과 열정을 발휘하는 데 큰 도움이 됩니다. 자녀가 있다면 교육 환경은 더할나위 없이 좋겠지요.",
    },

    "ISFJ" :
    {
        "comment1" :
        "수호자(ISFJ)는 겸손한 자세로 세상을 지탱하는 역할을 합니다.\
        이들은 근면하고 헌신적인 성격으로 주변 사람들에 대한 깊은 책임감을 느낍니다.\
        이들은 마감 기한을 철저히 지키고 동료와 친구의 생일과 기념일을 챙기며, 기존 질서를 유지하고 주변 사람을 배려하는 동시에 기꺼이 도움의 손길을 건넵니다.\
        또한 감사를 요구하기보다는 뒤에서 묵묵히 헌신하는 성격이라고 할 수 있습니다.",
        
        "comment2" :
        "이타적이고 가족 중심적인 성향을 가지고 있는 당신은 안정적이고 안전한 주거 환경을 통해 중요시하는 가족의 행복과 안정에 대한 보장이 필요해 보이네요.\
        또한 <span class='focusOn'>질 높은 교육 환경</span>은 자녀들의 성장과 발전에 큰 도움을 주고, <span class='focusOn'>당신의 따뜻함을 전하는 커뮤니티, 공원, 의료시설의 인프라</span>가 매우 어울립니다.",
    },

    "ESTJ" :
    {
        "comment1" :
        "경영자(ESTJ)는 전통과 질서를 중시하는 성격으로, 자신이 생각하는 옳고 그름과 사회적 기준에 따라 가족과 공동체가 화합할 수 있도록 노력합니다.\
        이들은 정직과 헌신과 존엄성을 중시하며, 어려운 길을 기꺼이 앞장서고 다른 사람들에게 명확한 조언과 지도를 제공합니다.\
        이들은 사람들이 화합하도록 하는 일에서 자부심을 느끼며, 모든 사람이 지역 축제를 즐길 수 있도록 노력하거나 가족과 공동체의 전통적인 가치관을 지키는 역할 등을 맡곤 합니다.",
        
        "comment2" :
        "효율성, 구조와 프로세스를 중시하는 당신은 일상생활의 체계와 규칙이 정립됨으로 안정적인 마음을 갖게 되네요.\
        이를 위해서는 <span class='focusOn'>교육 수준이 높고, 인프라가 잘 정비된 지역</span>에서 생활하는 것이 중요합니다.\
        높은 교육 수준은 생활의 규칙성을 만든고, 다양한 편의시설은 당신의 일상생활을 <span class='focusOn'>더 체계적이고 원활하게</span> 만들어 줄겁니다.",
    },

    "ESFJ" :
    {
        "comment1" :
        "집정관(ESFJ)에게 인생이란 다른 사람과 함께할 때 가장 달콤한 것입니다.\
        이들은 많은 공동체의 기반이 되며 친구와 연인과 이웃을 열린 마음으로 대합니다.\
        집정관이 모든 사람을 좋아하거나 무한한 관용을 지닌 것은 아닙니다.\
        하지만 이들은 친절하고 예의 바른 태도가 도움이 된다고 믿고 있으며 주변 사람들에게 강한 책임감을 느끼곤 합니다.",
        
        "comment2" :
        "가족과 친구, 이웃과의 따뜻한 관계를 중요시하는 당신은 <span class='focusOn'>안전하고 쾌적한 주거 환경</span>이 매우 중요하네요.\
        그래야 가까운 이웃들과 긍정적인 관계를 맺을 수 있는 기회가 많을거고요.\
        또한 가족과 친구들과의 시간을 더 자주, 더 의미 있게 보내기 위해 <span class='focusOn'>커뮤니티 인프라</span>가 잘 갖춰진 곳이 필요합니다.\
        이런 환경에서는 당신의 사교적이고 배려 깊은 성향이 더욱 빛날 수 있을거예요."
    },

    "ISTP" :
    {
        "comment1" :
        "장인(ISTP)은 이성과 호기심을 통해 세상을 바라보며 눈과 손으로 직접 탐구하는 일을 즐깁니다.\
        이들은 타고난 손기술을 지니고 있으며, 다양한 프로젝트에서 유용하고 재미있는 물건을 만들어 내고 주변 환경에서 배울 점을 찾습니다.\
        장인은 보통 기술자나 엔지니어로 일하는 경우가 많으며 물건을 직접 분해하고 조립해 개선하는 일을 즐깁니다.",
        
        "comment2" :
        "다재다능하고 독립적인 성격의 당신은 <span class='focusOn'>개인적인 공간을 매우 중요</span>하게 생각하네요.\
        능력이 워낙 출중하다보니 실용적이고 현실적인 학습도 많이 필요로 하고 있을 겁니다.\
        따라서 <span class='focusOn'>조용하고 안정적인 주거 환경</span>과 <span class='focusOn'>질 높은 교육 시설이 갖춰진 지역</span>이, 당신의 독립적이고 실용적인 삶에 가장 잘 어울리네요."
    },

    "ISFP" :
    {
        "comment1" :
        "모험가(ISFP)는 진정한 의미의 예술가라고 할 수 있습니다.\
        하지만 모험가라고 반드시 예술 업계에만 종사하는 것은 아닙니다.\
        이들에게는 삶 자체가 자신을 표현하기 위한 캔버스이기 때문입니다.\
        이들은 입는 옷부터 여가 시간을 보내는 방식까지 다양한 측면에서 자신의 독특한 개성을 생생히 드러냅니다.\
        모든 모험가는 각자 독특한 성격을 지니고 있습니다.\
        이들은 호기심이 많고 새로운 것을 추구하는 성격으로 다양한 분야에 관심과 열정을 보일 때가 많습니다.",
        
        "comment2" :
        "자유롭고 개방적인 환경에서 자신만의 개성과 창의성 표현을 좋아하는 당신은\
        <span class='focusOn'>자연과 가까우면서도 주거 환경이 쾌적한 지역</span>의 평화로운 분위기 속에서 자신의 감각을 마음껏 발휘할 수 있습니다.\
        또한 가까운 거리에 다양한 예술적, 문화적 활동을 즐길 수 있는 시설이 있다면, 개성적이고 창의적인 면모를 더욱 풍부하게 펼칠 수 있을 것으로 보이네요.\
        쾌적한 주거환경과 <span class='focusOn'>문화적 관람이나 지원시설이 있는 인프라</span>가 매우 잘 어울립니다."
    },
    
    "ESTP" :
    {
        "comment1" :
        "사업가(ESTP)는 항상 주변 사람에게 영향력을 행사하곤 합니다.\
        파티에서 가는 곳마다 사람들에게 둘러싸여 있는 사람을 발견한다면 바로 사업가일 것입니다.\
        이들은 직설적인 유머 감각을 지니고 있으며 수많은 사람의 관심을 받는 일을 즐깁니다.\
        한 마디로 사회자가 무대로 올라올 사람을 찾을 때 직접 무대로 올라가는 성격이라고 할 수 있습니다.",
        
        "comment2" :
        "모험심이 강하고 사교적이며 실용적인 성향의 당신은 <span class='focusOn'>효율적이고 빠르게 변하는 환경에서 최고의 능력을 발휘</span>할 수 있을 거예요.\
        그래서 인프라가 잘 발달한 지역에서 비즈니스, 취업 등 다양한 기회가 많기 때문에 자신을 표현하고 성취할 수 있는 환경이 매우 잘 만들어져 있지요.\
        또한 문제 해결 능력이 뛰어나고 실용적인 접근 방식을 선호하기 때문에 필요한 <span class='focusOn'>자원과 정보가 쉽게 접근 가능한 인프라 발달 지역</span>이 너무 잘 어울립니다.",
    },
    
    "ESFP" :
    {
        "comment1" :
        "연예인(ESFP)은 즉흥적으로 노래하고 춤을 추는 일을 즐기는 성격입니다.\
        이들은 지금 이 순간을 즐기며 남들도 자신과 같은 즐거움을 느낄 수 있기를 바랍니다.\
        또한 남을 응원하는 데 기꺼이 시간과 에너지를 투자하며, 매우 매력적인 방식으로 다른 사람의 기운을 북돋곤 합니다.",
        
        "comment2" :
        "에너지와 열정이 넘치는 당신은 활기찬 환경에서 가진 <span class='focusOn'>에너지를 최대한 발휘할 수 있는 환경</span>이 필요하겠네요.\
        <span class='focusOn'>인프라가 잘 갖추어진 지역</span>은 다양한 활동 기회가 있고, 여러 사람들과 교류할 수 있어서 ESFP가 만족할 만한 요소들이 많이 제공되고 있습니다.\
        이런 곳들은 다양한 문화, 예술, 음악, 요리 및 사회적 이벤트가 넘쳐나고, 길 수 있는 활동이 풍부할 겁니다."
    }   
}

var mbti_result_comment_short = {
    "INTJ" : 
    "전략가는 조용히 사색을 하며 상황을 판단하고, 때로는 깊은 외로움을 스스로 선택하며 풀리지 않던 문제에 무한히 집중하기도 합니다.\
    INTJ 성향으로 용의주도한 전략가인 당신께는 외롭지만 사색하기 좋은 주거 환경과 사고 능력을 충분히 발휘할 수 있는 교육 환경이 우수한 단지가 어울립니다.",

    "INTP" :
    "논리적이면서 창의적이기는 매우 어렵습니다. 그런데 당신은 그 모든 것을 갖춘 사람이네요.\
    스스로의 창의성에 몰입하는 당신은 외로움을 타지는 않지만, 집중할 수 있는 쾌적하고 안정적인 주거 환경과,\
    언제든 궁금점을 찾아볼 수 있는 융통성 있는 교육환경이 필요해 보이네요. 그렇다고 도서관 같은 중요한 인프라가 빠질 수는 없겠죠?",  
    

    "ENTJ" :
    "강력한 리더쉽을 가진 당신은 사람들의 선망의 대상이 되기도 하지만, 때로는 시기와 질투의 대상이 되기도 합니다.\
    그럼에도 불구하고 자신만의 뚜렷한 목표의식과 끈기있는 돌파로 실패를 거듭해도 반드시 해내고 마는 사람입니다.\
    많은 사람을 이끌어갈 수 있도록 세대수가 많은 대단지와 주변 환경을 적극적으로 활용할 수 있는 인프라가 잘 구축된 단지가 매우 어울리네요.",

    "ENTP" :
    "어떠한 상황에서도 빠른 판단력과 특유의 논리정연함으로 토론의 중심에 설 수 있는 당신은 '달변'이라는 호칭도 많이 듣겠군요.\
    상황에 대한 판단이 워낙 빠르기 때문에 대응도 매우 빠른 편입니다. 다른 사람이 생각할 시간 동안 당신은 다음 단계의 대응을 준비하고 있겠네요.\
    빠른 대응을 위해 주변의 인프라 요소가 잘 갖추어진 곳과, 이동이 용이한 교통 요충지가 매우 어울립니다.",

    "INFJ" :
    "선한 영향력을 발휘하는 당신은, 모두가 만나고 싶어하고 함께 있고 싶어하지만, \
    스스로는 조용한 시간을 즐기는 사색가의 면모를 함께 가지고 있습니다.\
    선한 영향력은 때로 그 확장을 시기하고 질투하는 사람들에 의해 모함을 받는 경우가 많을텐데요,\
    마음을 다스리는 평안한 주거환경과 주변이 조용한 교육환경이 좋은 단지가 어울립니다.",

    "INFP" :        
    "조용하고 드러나지 않아 보이는 당신이지만 혼자 또는 소수의 몇 명이서는 열정적으로 즐기고 놀 줄 아는 사람입니다.\
    혼자 또는 소수의 돈독한 친구와 함께하는 시간을 보내기 위해 쾌적한 주거 환경이 갖추어진 단지와\
    소통으로 어려움을 겪는 주변의 사람들과 대화할 수 있는 조용한 커피숍 환경의 인프라 단지가 매우 어울리네요.",

    "ENFJ" :        
    "원대한 꿈을 꾸면서 세상에 긍정적인 영향을 만들어내고 싶어 하는 당신은, 많은 사람들을 독려하며 솔선수범하는 사람이네요.\
    강력한 카리스마로 저돌적인 리더에 가까운 ENTJ와는 사뭇 다르게 부드러운 리더쉽을 발휘함으로 멘토 역할을 주로 하게 됩니다.\
    코칭과 멘토링이 필요한 교육과 인프라가 갖추어진 곳에서 활동하는 리더의 모습이 보여지네요.",

    "ENFP" :        
    "당신은 새로운 경험을 좋아하고, 변화에 잘 적응하는 편이기 때문에 생활의 활기와 다채로운 활동을 즐길 수 있는 환경이 적합하네요.\
    특히 다른 곳으로 이동하여 다양한 활동에 참여하면서 모험심과 호기심을 만족시킬 필요가 있고요, 다양한 문화 활동, 예술 행사, 그리고 커뮤니티 이벤트에 쉽게 접근할 수 있어야 해요.\
    결론적으로 교통과 인프라가 잘 갖추어진 단지가 매우 어울리네요.",
    
    "ISTJ" :        
    "당신은 창의적이고 열정적인 면모가 강하지만, 동시에 현실주의적인 성향도 지니고 있어 안정성을 중요시하네요.\
    따라서 안정적인 교육 환경을 통해 당신이 가지는 지적 호기심과 학습 욕구를 충족시키고, 안정적인 주거환경을 통해 안전하고 평온한 기반을 마련하는 것이\
    창의성과 열정을 발휘하는 데 큰 도움이 됩니다. 자녀가 있다면 교육 환경은 더할나위 없이 좋겠지요.",

    "ISFJ" :
    "이타적이고 가족 중심적인 성향을 가지고 있는 당신은 안정적이고 안전한 주거 환경을 통해 중요시하는 가족의 행복과 안정에 대한 보장이 필요해 보이네요.\
    또한 질 높은 교육 환경은 자녀들의 성장과 발전에 큰 도움을 주고, 당신의 따뜻함을 전하는 커뮤니티, 공원, 의료시설의 인프라가 매우 어울립니다.",

    "ESTJ" :
    "효율성, 구조와 프로세스를 중시하는 당신은 일상생활의 체계와 규칙이 정립됨으로 안정적인 마음을 갖게 되네요.\
    이를 위해서는 교육 수준이 높고, 인프라가 잘 정비된 지역에서 생활하는 것이 중요합니다.\
    높은 교육 수준은 생활의 규칙성을 만든고, 다양한 편의시설은 당신의 일상생활을 더 체계적이고 원활하게 만들어 줄겁니다.",

    "ESFJ" :
    "가족과 친구, 이웃과의 따뜻한 관계를 중요시하는 당신은 안전하고 쾌적한 주거 환경이 매우 중요하네요.\
    그래야 가까운 이웃들과 긍정적인 관계를 맺을 수 있는 기회가 많을거고요.\
    또한 가족과 친구들과의 시간을 더 자주, 더 의미 있게 보내기 위해 커뮤니티 인프라가 잘 갖춰진 곳이 필요합니다.\
    이런 환경에서는 당신의 사교적이고 배려 깊은 성향이 더욱 빛날 수 있을거예요.",

    "ISTP" :
    "다재다능하고 독립적인 성격의 당신은 개인적인 공간을 매우 중요하게 생각하네요.\
    능력이 워낙 출중하다보니 실용적이고 현실적인 학습도 많이 필요로 하고 있을 겁니다.\
    따라서 조용하고 안정적인 주거 환경과 질 높은 교육 시설이 갖춰진 지역이, 당신의 독립적이고 실용적인 삶에 가장 잘 어울리네요.",

    "ISFP" :
    "자유롭고 개방적인 환경에서 자신만의 개성과 창의성 표현을 좋아하는 당신은\
    자연과 가까우면서도 주거 환경이 쾌적한 지역의 평화로운 분위기 속에서 자신의 감각을 마음껏 발휘할 수 있습니다.\
    또한 가까운 거리에 다양한 예술적, 문화적 활동을 즐길 수 있는 시설이 있다면, 개성적이고 창의적인 면모를 더욱 풍부하게 펼칠 수 있을 것으로 보이네요.\
    쾌적한 주거환경과 문화적 관람이나 지원시설이 있는 인프라가 매우 잘 어울립니다.",
    
    "ESTP" :
    "모험심이 강하고 사교적이며 실용적인 성향의 당신은 효율적이고 빠르게 변하는 환경에서 최고의 능력을 발휘할 수 있을 거예요.\
    그래서 인프라가 잘 발달한 지역에서 비즈니스, 취업 등 다양한 기회가 많기 때문에 자신을 표현하고 성취할 수 있는 환경이 매우 잘 만들어져 있지요.\
    또한 문제 해결 능력이 뛰어나고 실용적인 접근 방식을 선호하기 때문에 필요한 자원과 정보가 쉽게 접근 가능한 인프라 발달 지역이 너무 잘 어울립니다.",
    
    "ESFP" :        
    "에너지와 열정이 넘치는 당신은 활기찬 환경에서 가진 에너지를 최대한 발휘할 수 있는 환경이 필요하겠네요.\
    인프라가 잘 갖추어진 지역은 다양한 활동 기회가 있고, 여러 사람들과 교류할 수 있어서 ESFP가 만족할 만한 요소들이 많이 제공되고 있습니다.\
    이런 곳들은 다양한 문화, 예술, 음악, 요리 및 사회적 이벤트가 넘쳐나고, 길 수 있는 활동이 풍부할 겁니다."
}

var E3 = {
    "living": 0.3,
    "edu": 0.3,
    "infra": 3.0,
    "trans": 1.5,    
}

var E2 = {
    "living": 0.4,
    "edu": 0.4,
    "infra": 2.9,
    "trans": 1.4, 
}

var E1 = {
    "living": 0.5,
    "edu": 0.5,
    "infra": 2.8,
    "trans": 1.3, 
}

var I3 = {
    "living": 3.0,
    "edu": 1.0,
    "infra": 0.3,
    "trans": 0.3,
}
var I2 = {
    "living": 2.9,
    "edu": 0.9,
    "infra": 0.4,
    "trans": 0.4,     
}
var I1 = {
    "living": 2.8,
    "edu": 0.8,
    "infra": 0.5,
    "trans": 0.5,
}

var N3 = {
    "living": 3.0,
    "edu": 0.3,
    "infra": 0.2,
    "trans": 0.8,    
}
var N2 = {
    "living": 2.9,
    "edu": 0.4,
    "infra": 0.3,
    "trans": 0.7,
}
var N1 = {
    "living": 2.8,
    "edu": 0.5,
    "infra": 0.4,
    "trans": 0.6,
}

var S3 = {
    "living": 3.0,
    "edu": 0.3,
    "infra": 0.8,
    "trans": 0.3,
}
var S2 = {
    "living": 2.9,
    "edu": 0.4,
    "infra": 0.7,
    "trans": 0.4,
}
var S1 = {
    "living": 2.8,
    "edu": 0.5,
    "infra": 0.6,
    "trans": 0.5,
}

var T3 = {
    "living": 0.3,
    "edu": 3.0,
    "infra": 0.3,
    "trans": 0.8,    
}
var T2 = {
    "living": 0.4,
    "edu": 2.9,
    "infra": 0.4,
    "trans": 0.7,   
}
var T1 = {
    "living": 0.5,
    "edu": 2.8,
    "infra": 0.5,
    "trans": 0.6, 
}

var F3 = {
    "living": 0.6,
    "edu": 0.3,
    "infra": 3.0,
    "trans": 0.3,    
}
var F2 = {
    "living": 0.5,
    "edu": 0.4,
    "infra": 2.9,
    "trans": 0.4,
}
var F1 = {
    "living": 0.6,
    "edu": 0.5,
    "infra": 2.6,
    "trans": 0.4,
}

var J3 = {
    "living": 0.8,
    "edu": 3.0,
    "infra": 0.3,
    "trans": 0.3,    
}
var J2 = {
    "living": 0.7,
    "edu": 2.9,
    "infra": 0.4,
    "trans": 0.4,
}
var J1 = {
    "living": 0.6,
    "edu": 2.8,
    "infra": 0.5,
    "trans": 0.5,
}

var P3 = {
    "living": 0.3,
    "edu": 0.1,
    "infra": 3.0,
    "trans": 0.5,    
}
var P2 = {
    "living": 0.4,
    "edu": 0.2,
    "infra": 2.9,
    "trans": 0.4, 
}
var P1 = {
    "living": 0.5,
    "edu": 0.2,
    "infra": 2.7,
    "trans": 0.5,
}

function sortList(apt_list){
    sortData = []      

    key = "MBTI_VAL"
    type = "desc"
    data = apt_list
    var sortJSON = function(data, key, type) {
      if (type == undefined) {
        type = "asc";
      }
      return data.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        if (type == "desc") {
          return x > y ? -1 : x < y ? 1 : 0;
        } else if (type == "asc") {
          return x < y ? -1 : x > y ? 1 : 0;
        }
      });
    };
    
    sorted_apt_result = sortJSON(data, key, type)
    sortData = sorted_apt_result

    return sortData
  }

  function drawValueChart(canvas_id, val){
    //console.log(canvas_id)
    labels = ["주거", "교통", "인프라", "학군"]
    bg_colors = [
        'rgba(255, 99, 132, 0.3)',
        'rgba(75, 192, 192, 0.3)',
        'rgba(255, 205, 86, 0.3)',
        'rgba(201, 203, 207, 0.3)',
        'rgba(54, 162, 235, 0.3)'
    ]

    if(val.length < 4){
        labels = ["주거", "인프라", "학군"]
        bg_colors = [
            'rgba(255, 99, 132, 0.3)',
            'rgba(255, 205, 86, 0.3)',
            'rgba(201, 203, 207, 0.3)',
            'rgba(54, 162, 235, 0.3)'
        ]
    }

    var ctx = document.getElementById(canvas_id)
    var chartview = new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: labels,
          datasets: [{
            data: val,
            backgroundColor: bg_colors
          }]          
        },
        options: {
            scale: {
                scaleLabel: {
                    display: true
                },
                ticks:{
                    display: false
                },
                pointLabels: {
                    display: false
                }
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {          
                    display: true,
                    position: 'right',
                    align: 'center',
                    labels:{
                      boxWidth: 12,
                      boxHeight: 12,
                      font:{
                        size: 12
                      }            
                    }
                  },
            }
        }
      });  
  }

  function showMap(div_id, center, complex){
    if(isMobile){
        dw = $(window).innerWidth() * 0.83
    }
    else{
        dw = 420
    }

    var MapOptions = {
        center: center,
        size: new naver.maps.Size(dw, 200),
        zoom: 16, //지도의 초기 줌 레벨
        draggable: false,
        pinchZoom: false,    
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: false,
        disableDoubleClickZoom: false,
        disableTwoFingerTapZoom: false,
    };

    defaultMap = new naver.maps.Map(div_id, MapOptions);

    //console.log(complex)

    var last_sales = (complex['last_sales']).split(",")
    var aptValue = complex['가치 총점']
    var complex_grade = setGrade(aptValue)

    var last_sales_date = last_sales[0].toString();
    var last_sales_price = last_sales[1].toString();
    var last_sales_area = last_sales[2];

    if (isNaN(last_sales_price)) {
        last_sales_price_kor = "정보없음"
        last_sales_area_kor = "--"
    } else {
        last_sales_price_kor = Math.round(last_sales_price / 100) / 100 + "억"
        last_sales_area_kor = last_sales_area
    }
    
    var svg_color = "#CC0000"
    var grade = ""
    if(aptValue >= 70){
        svg_color = "#CC0000"
        grade = "gradeS"
    }
    else if(aptValue < 70 && aptValue >= 55){
        svg_color = "#F72020"
        grade = "gradeA"
    }
    else if(aptValue < 55 && aptValue >= 40){
        svg_color = "#F36637"
        grade = "gradeB"
    }
    else{
        svg_color = "#ED8618"
        grade = "gradeC"
    }

    svg_loc_detail = `
    <svg version="1.1" class="detail_marker_${grade}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 35 35" style="enable-background:new 0 0 800 1200;" xml:space="preserve" width="68", height="60">
        
    <defs>
    <style>
    .detail_marker_${grade}{fill:${svg_color}}
    .large_marker_${grade} {stroke:${svg_color}; stroke-width:0.5}      
    .cls-2{fill:#fff;}
    .cls-3_text{fill:#fff; font-size:8px; font-weight:600}
    .cls-4_text{fill:#000; font-size:7px; font-weight:600}            
    .cls-5_text{fill:#000; font-size:5px; font-weight:600}
    .cls-6_text{fill:#000; font-size:4px; font-weight:600}
    </style>
    </defs>
    <g class="svg_loc_large">
    <path class="cls-1 large_marker_${grade}" d="M.12,12.29V8.81A.88.88,0,0,1,.55,8L15.31.47a3.07,3.07,0,0,1,2.83,0L33,8a.85.85,0,0,1,.43.77v3.48Z"/>
    <path class="cls-2 large_marker_${grade}" d="M.13,12.29V26.36c0,1.37.63,2.47,1.4,2.47H3.36L4.52,31l1.16,2.15L6.84,31,8,28.83H32.06c.78,0,1.41-1.1,1.41-2.47V12.29Z"/>
    <text class="cls-3_text" text-anchor="middle" x="16.5" y="10">${complex_grade}</text>
    <text class="cls-4_text" text-anchor="middle" x="17" y="20">${last_sales_price_kor}</text>
    <text class="cls-5_text" text-anchor="middle" x="17" y="26">${last_sales_area_kor}</text>
    </g>
    </svg>
    `
    var detailMarker = new naver.maps.Marker({
        position: center,
        icon: {
            content: svg_loc_detail,
            size: new naver.maps.Size(24, 37),
            anchor: new naver.maps.Point(12, 60),
            origin: center,
        },
        zIndex: 100,
        map: defaultMap,
    });
}

function kakaoShare2(shareTitle, shareText, shareURL) {  
    console.log(shareURL)
    Kakao.Share.sendDefault({    
      objectType: 'text',
      text: shareText,    
      link: {
        mobileWebUrl: shareURL,
        webUrl: shareURL,
      },    
      buttons: [
        {
          title: '나도 해보기',
          link: {
            mobileWebUrl: shareURL,
            webUrl: shareURL,
          },
        },
        {
          title: '리얼랭커스 앱',
          link: {
            androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
          },
        },
      ]    
    });
  }

/*
var E3 = {
    "living": 5,
    "edu": 5,
    "infra": 60,
    "trans": 30,    
}

var E2 = {
    "living": 10,
    "edu": 10,
    "infra": 55,
    "trans": 25,
}

var E1 = {
    "living": 20,
    "edu": 20,
    "infra": 40,
    "trans": 20,
}

var I3 = {
    "living": 60,
    "edu": 30,
    "infra": 5,
    "trans": 5,    
}
var I2 = {
    "living": 55,
    "edu": 25,
    "infra": 10,
    "trans": 10,     
}
var I1 = {
    "living": 40,
    "edu": 20,
    "infra": 20,
    "trans": 20, 
}

var N3 = {
    "living": 60,
    "edu": 15,
    "infra": 10,
    "trans": 25,    
}
var N2 = {
    "living": 60,
    "edu": 10,
    "infra": 10,
    "trans": 20,
}
var N1 = {
    "living": 50,
    "edu": 20,
    "infra": 20,
    "trans": 10,
}

var S3 = {
    "living": 60,
    "edu": 10,
    "infra": 20,
    "trans": 10,    
}
var S2 = {
    "living": 50,
    "edu": 15,
    "infra": 20,
    "trans": 15, 
}
var S1 = {
    "living": 45,
    "edu": 15,
    "infra": 25,
    "trans": 15,
}

var T3 = {
    "living": 10,
    "edu": 60,
    "infra": 10,
    "trans": 20,    
}
var T2 = {
    "living": 10,
    "edu": 50,
    "infra": 20,
    "trans": 20,
}
var T1 = {
    "living": 20,
    "edu": 40,
    "infra": 20,
    "trans": 20,
}

var F3 = {
    "living": 20,
    "edu": 10,
    "infra": 60,
    "trans": 10,    
}
var F2 = {
    "living": 30,
    "edu": 20,
    "infra": 50,
    "trans": 10, 
}
var F1 = {
    "living": 30,
    "edu": 20,
    "infra": 30,
    "trans": 20, 
}

var J3 = {
    "living": 20,
    "edu": 60,
    "infra": 10,
    "trans": 10,    
}
var J2 = {
    "living": 30,
    "edu": 50,
    "infra": 15,
    "trans": 15,
}
var J1 = {
    "living": 30,
    "edu": 40,
    "infra": 15,
    "trans": 15,
}

var P3 = {
    "living": 10,
    "edu": 5,
    "infra": 60,
    "trans": 25,    
}
var P2 = {
    "living": 15,
    "edu": 10,
    "infra": 50,
    "trans": 25, 
}
var P1 = {
    "living": 20,
    "edu": 10,
    "infra": 40,
    "trans": 30,
}
    */