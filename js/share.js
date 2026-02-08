var shareTitle = ""
var shareText = ""
var shareURL = ""
var kakaoShareURL = ""
var kakaoShareText = []
var kakaoKey = "a8a036bfb275fc87317e07f76dccecb2"
var NAVER_CLIENT_KEY = "QCL0Cjpsn2RIarmMDeKA"
var isMobile = false
var test_status = false

var login_status = false
var kakao_login_status = false
var naver_login_status = false
var apple_login_status = false
const expireTime = 180 * 24 * 60 * 60 * 1000

var temp_email = 'abc@abc.com'
var shown_email = ''
var temp_uid = 'abcdefghijklmnopqrstuvwxyz'
var blocked = 'false'
var block_start = '1976-1-1 00:00:00'
var block_end = '1976-1-1 00:00:00'

var UserAgent = navigator.userAgent;
var scr_width = screen.width
var scr_height = screen.height

var user_stat = new Object({
	accused: 0,
	blocked: 'false',
	block_days: 0,
	block_start: '1976-1-1',
	block_end: '1976-1-1',
	like: "",
	dislike: "",
	accusing: ""
})

var codeMap = [
  ['sotp', 'Korea', '1100000000_Seoul'],
  ['sogn', 'Seoul', '1168000000_Seoul_Gangnam'],
  ['sogd', 'Seoul', '1174000000_Seoul_Gangdong'],
  ['sogb', 'Seoul', '1130500000_Seoul_Gangbuk'],
  ['sogs', 'Seoul', '1150000000_Seoul_Gangseo'],
  ['soga', 'Seoul', '1162000000_Seoul_Gwanak'],
  ['sogj', 'Seoul', '1121500000_Seoul_Gwangjin'],
  ['sogr', 'Seoul', '1153000000_Seoul_Guro'],
  ['sogc', 'Seoul', '1154500000_Seoul_Geumcheon'],
  ['sonw', 'Seoul', '1135000000_Seoul_Nowon'],
  ['sodb', 'Seoul', '1132000000_Seoul_Dobong'],
  ['sodd', 'Seoul', '1123000000_Seoul_Dongdaemun'],
  ['sodj', 'Seoul', '1159000000_Seoul_Dongjak'],
  ['somp', 'Seoul', '1144000000_Seoul_Mapo'],
  ['sosm', 'Seoul', '1141000000_Seoul_Seodaemun'],
  ['sosc', 'Seoul', '1165000000_Seoul_Seocho'],
  ['sosd', 'Seoul', '1120000000_Seoul_Seongdong'],
  ['sosb', 'Seoul', '1129000000_Seoul_Seongbuk'],
  ['sosp', 'Seoul', '1171000000_Seoul_Songpa'],
  ['soyc', 'Seoul', '1147000000_Seoul_Yangcheon'],
  ['soyd', 'Seoul', '1156000000_Seoul_Yeongdeungpo'],
  ['soys', 'Seoul', '1117000000_Seoul_Yongsan'],
  ['soep', 'Seoul', '1138000000_Seoul_Eunpyeong'],
  ['sojr', 'Seoul', '1111000000_Seoul_Jongno'],
  ['sojg', 'Seoul', '1114000000_Seoul_Jung'],
  ['sojn', 'Seoul', '1126000000_Seoul_Jungnang'],

  ['ggtp', 'Korea', '4100000000_Gyeonggi'],
  ['ggga', 'Gyeonggi', '4182000000_Gyeonggi_Gapyeong'],
  ['ggdy', 'Gyeonggi', '4128100000_Gyeonggi_Goyang_Deogyang'],
  ['ggid', 'Gyeonggi', '4128500000_Gyeonggi_Goyang_Ilsandong'],
  ['ggis', 'Gyeonggi', '4128700000_Gyeonggi_Goyang_Ilsanseo'],
  ['gggc', 'Gyeonggi', '4129000000_Gyeonggi_Gwacheon'],
  ['gggm', 'Gyeonggi', '4121000000_Gyeonggi_Gwangmyeong'],
  ['gggj', 'Gyeonggi', '4161000000_Gyeonggi_Gwangju'],
  ['gggr', 'Gyeonggi', '4131000000_Gyeonggi_Guri'],
  ['gggu', 'Gyeonggi', '4141000000_Gyeonggi_Gunpo'],
  ['gggp', 'Gyeonggi', '4157000000_Gyeonggi_Gimpo'],
  ['ggny', 'Gyeonggi', '4136000000_Gyeonggi_Namyangju'],
  ['ggdd', 'Gyeonggi', '4125000000_Gyeonggi_Dongducheon'],
  ['ggss', 'Gyeonggi', '4119400000_Gyeonggi_Bucheon_Sosa'],
  ['ggoj', 'Gyeonggi', '4119600000_Gyeonggi_Bucheon_Ojeong'],
  ['ggwm', 'Gyeonggi', '4119200000_Gyeonggi_Bucheon_Wonmi'],
  ['ggbd', 'Gyeonggi', '4113500000_Gyeonggi_Seongnam_Bundang'],
  ['ggsu', 'Gyeonggi', '4113100000_Gyeonggi_Seongnam_Sujeong'],
  ['ggjw', 'Gyeonggi', '4113300000_Gyeonggi_Seongnam_Jungwon'],
  ['gggs', 'Gyeonggi', '4111300000_Gyeonggi_Suwon_Gwonseon'],
  ['ggyt', 'Gyeonggi', '4111700000_Gyeonggi_Suwon_Yeongtong'],
  ['ggja', 'Gyeonggi', '4111100000_Gyeonggi_Suwon_Jangan'],
  ['ggpd', 'Gyeonggi', '4111500000_Gyeonggi_Suwon_Paldal'],
  ['ggsh', 'Gyeonggi', '4139000000_Gyeonggi_Siheung'],
  ['ggdw', 'Gyeonggi', '4127300000_Gyeonggi_Ansan_Danwon'],
  ['ggsn', 'Gyeonggi', '4127100000_Gyeonggi_Ansan_Sangnok'],
  ['ggas', 'Gyeonggi', '4155000000_Gyeonggi_Anseong'],
  ['ggda', 'Gyeonggi', '4117300000_Gyeonggi_Anyang_Dongan'],
  ['ggma', 'Gyeonggi', '4117100000_Gyeonggi_Anyang_Manan'],
  ['ggyj', 'Gyeonggi', '4163000000_Gyeonggi_Yangju'],
  ['ggyp', 'Gyeonggi', '4183000000_Gyeonggi_Yangpyeong'],
  ['ggye', 'Gyeonggi', '4167000000_Gyeonggi_Yeoju'],
  ['ggyc', 'Gyeonggi', '4180000000_Gyeonggi_Yeoncheon'],
  ['ggos', 'Gyeonggi', '4137000000_Gyeonggi_Osan'],
  ['gggh', 'Gyeonggi', '4146300000_Gyeonggi_Yongin_Giheung'],
  ['ggsj', 'Gyeonggi', '4146500000_Gyeonggi_Yongin_Suji'],
  ['ggci', 'Gyeonggi', '4146100000_Gyeonggi_Yongin_Cheoin'],
  ['gguw', 'Gyeonggi', '4143000000_Gyeonggi_Uiwang'],
  ['gguj', 'Gyeonggi', '4115000000_Gyeonggi_Uijeongbu'],
  ['ggic', 'Gyeonggi', '4150000000_Gyeonggi_Icheon'],
  ['ggpj', 'Gyeonggi', '4148000000_Gyeonggi_Paju'],
  ['ggpt', 'Gyeonggi', '4122000000_Gyeonggi_Pyeongtaek'],
  ['ggpc', 'Gyeonggi', '4165000000_Gyeonggi_Pocheon'],
  ['gghn', 'Gyeonggi', '4145000000_Gyeonggi_Hanam'],
  ['gghs', 'Gyeonggi', '4159000000_Gyeonggi_Hwaseong'],
  ['gghm', 'Gyeonggi', '4159100000_Gyeonggi_Hwaseong_manse'],
  ['gghh', 'Gyeonggi', '4159300000_Gyeonggi_Hwaseong_hyohaeng'],
  ['gghb', 'Gyeonggi', '4159500000_Gyeonggi_Hwaseong_byungjeom'],
  ['gghd', 'Gyeonggi', '4159700000_Gyeonggi_Hwaseong_dongtan'],

  ['intp', 'Korea', '2800000000_Incheon'],
  ['ingh', 'Incheon', '2871000000_Incheon_Ganghwa'],
  ['ingy', 'Incheon', '2824500000_Incheon_Gyeyang'],
  ['innd', 'Incheon', '2820000000_Incheon_Namdong'],
  ['indo', 'Incheon', '2814000000_Incheon_Dong'],
  ['inmh', 'Incheon', '2817700000_Incheon_Michuhol'],
  ['inbp', 'Incheon', '2823700000_Incheon_Bupyeong'],
  ['inse', 'Incheon', '2826000000_Incheon_Seo'],
  ['inys', 'Incheon', '2818500000_Incheon_Yeonsu'],
  ['inju', 'Incheon', '2811000000_Incheon_Jung'],

  ['gjtp', 'Korea', '2900000000_Gwangju'],
  ['gjgs', 'Gwangju', '2920000000_Gwangju_Gwangsan'],
  ['gjna', 'Gwangju', '2915500000_Gwangju_Nam'],
  ['gjdo', 'Gwangju', '2911000000_Gwangju_Dong'],
  ['gjbu', 'Gwangju', '2917000000_Gwangju_Buk'],
  ['gjse', 'Gwangju', '2914000000_Gwangju_Seo'],

  ['dgtp', 'Korea', '2700000000_Daegu'],
  ['dgna', 'Daegu', '2720000000_Daegu_Nam'],
  ['dgds', 'Daegu', '2729000000_Daegu_Dalseo'],
  ['dgdg', 'Daegu', '2771000000_Daegu_Dalseong'],
  ['dgdo', 'Daegu', '2714000000_Daegu_Dong'],
  ['dgbu', 'Daegu', '2723000000_Daegu_Buk'],
  ['dgse', 'Daegu', '2717000000_Daegu_Seo'],
  ['dgss', 'Daegu', '2726000000_Daegu_Suseong'],  
  ['dgju', 'Daegu', '2711000000_Daegu_Jung'],
  ['dggw', 'Daegu', '2772000000_Daegu_Gunwi'],

  ['djtp', 'Korea', '3000000000_Daejeon'],
  ['djdd', 'Daejeon', '3023000000_Daejeon_Daedeok'],
  ['djdo', 'Daejeon', '3011000000_Daejeon_Dong'],
  ['djse', 'Daejeon', '3017000000_Daejeon_Seo'],
  ['djys', 'Daejeon', '3020000000_Daejeon_Yuseong'],
  ['djju', 'Daejeon', '3014000000_Daejeon_Jung'],

  ['bstp', 'Korea', '2600000000_Busan'],
  ['bsgs', 'Busan', '2644000000_Busan_Gangseo'],
  ['bsgj', 'Busan', '2641000000_Busan_Geumjeong'],
  ['bsgi', 'Busan', '2671000000_Busan_Gijangn'],
  ['bsna', 'Busan', '2629000000_Busan_Nam'],
  ['bsdo', 'Busan', '2617000000_Busan_Dong'],
  ['bsdn', 'Busan', '2626000000_Busan_Dongnae'],
  ['bsbj', 'Busan', '2623000000_Busan_Busanjin'],
  ['bsbu', 'Busan', '2632000000_Busan_Buk'],
  ['bsss', 'Busan', '2653000000_Busan_Sasang'],
  ['bssh', 'Busan', '2638000000_Busan_Saha'],
  ['bsse', 'Busan', '2614000000_Busan_Seo'],
  ['bssy', 'Busan', '2650000000_Busan_Suyeong'],
  ['bsyj', 'Busan', '2647000000_Busan_Yeonje'],
  ['bsyd', 'Busan', '2620000000_Busan_Yeongdo'],
  ['bsju', 'Busan', '2611000000_Busan_Jung'],
  ['bshd', 'Busan', '2635000000_Busan_Haeundae'],

  ['gwtp', 'Korea', '5100000000_Gangwondo'],
  ['gwgn', 'Gangwondo', '5115000000_Gangwondo_Gangneung'],
  ['gwgs', 'Gangwondo', '5182000000_Gangwondo_Goseong'],
  ['gwdh', 'Gangwondo', '5117000000_Gangwondo_Donghae'],
  ['gwsa', 'Gangwondo', '5123000000_Gangwondo_Samcheok'],
  ['gwsc', 'Gangwondo', '5121000000_Gangwondo_Sokcho'],
  ['gwyg', 'Gangwondo', '5180000000_Gangwondo_Yanggu'],
  ['gwyy', 'Gangwondo', '5183000000_Gangwondo_Yangyang'],
  ['gwyw', 'Gangwondo', '5175000000_Gangwondo_Yeongwol'],
  ['gwwj', 'Gangwondo', '5113000000_Gangwondo_Wonju'],
  ['gwij', 'Gangwondo', '5181000000_Gangwondo_Inje'],
  ['gwjs', 'Gangwondo', '5177000000_Gangwondo_Jeongseon'],
  ['gwcw', 'Gangwondo', '5178000000_Gangwondo_Cheorwon'],
  ['gwcc', 'Gangwondo', '5111000000_Gangwondo_Chuncheon'],
  ['gwtb', 'Gangwondo', '5119000000_Gangwondo_Taebaek'],
  ['gwpc', 'Gangwondo', '5176000000_Gangwondo_Pyeongchang'],
  ['gwhc', 'Gangwondo', '5172000000_Gangwondo_Hongcheon'],
  ['gwhw', 'Gangwondo', '5179000000_Gangwondo_Hwacheon'],
  ['gwhs', 'Gangwondo', '5173000000_Gangwondo_Hoengseong'],

  ['gntp', 'Korea', '4800000000_Gyeongsangnamdo'],
  ['gngj', 'Gyeongsangnamdo', '4831000000_Gyeongsangnamdo_Geoje'],
  ['gngc', 'Gyeongsangnamdo', '4888000000_Gyeongsangnamdo_Geochang'],
  ['gngs', 'Gyeongsangnamdo', '4882000000_Gyeongsangnamdo_Goseong'],
  ['gngh', 'Gyeongsangnamdo', '4825000000_Gyeongsangnamdo_Gimhae'],
  ['gnnh', 'Gyeongsangnamdo', '4884000000_Gyeongsangnamdo_Namhae'],
  ['gnmy', 'Gyeongsangnamdo', '4827000000_Gyeongsangnamdo_Miryang'],
  ['gnsa', 'Gyeongsangnamdo', '4824000000_Gyeongsangnamdo_Sacheon'],
  ['gnsc', 'Gyeongsangnamdo', '4886000000_Gyeongsangnamdo_Sancheong'],
  ['gnys', 'Gyeongsangnamdo', '4833000000_Gyeongsangnamdo_Yangsan'],
  ['gnur', 'Gyeongsangnamdo', '4872000000_Gyeongsangnamdo_Uiryeong'],
  ['gnjj', 'Gyeongsangnamdo', '4817000000_Gyeongsangnamdo_Jinju'],
  ['gncn', 'Gyeongsangnamdo', '4874000000_Gyeongsangnamdo_Changnyeong'],
  ['gnmp', 'Gyeongsangnamdo', '4812500000_Gyeongsangnamdo_Changwon_Masanhappo'],
  ['gnmh', 'Gyeongsangnamdo', '4812700000_Gyeongsangnamdo_Changwon_Masanhoewon'],
  ['gnss', 'Gyeongsangnamdo', '4812300000_Gyeongsangnamdo_Changwon_Seongsan'],
  ['gnuc', 'Gyeongsangnamdo', '4812100000_Gyeongsangnamdo_Changwon_Uichang'],
  ['gnjh', 'Gyeongsangnamdo', '4812900000_Gyeongsangnamdo_Changwon_Jinhae'],
  ['gnty', 'Gyeongsangnamdo', '4822000000_Gyeongsangnamdo_Tongyeong'],
  ['gnhd', 'Gyeongsangnamdo', '4885000000_Gyeongsangnamdo_Hadong'],
  ['gnha', 'Gyeongsangnamdo', '4873000000_Gyeongsangnamdo_Haman'],
  ['gnhy', 'Gyeongsangnamdo', '4887000000_Gyeongsangnamdo_Hamyang'],
  ['gnhc', 'Gyeongsangnamdo', '4889000000_Gyeongsangnamdo_Hapcheon'],

  ['gbtp', 'Korea', '4700000000_Gyeongsangbukdo'],
  ['gbgs', 'Gyeongsangbukdo', '4729000000_Gyeongsangbukdo_Gyeongsan'],
  ['gbgj', 'Gyeongsangbukdo', '4713000000_Gyeongsangbukdo_Gyeongju'],
  ['gbgr', 'Gyeongsangbukdo', '4783000000_Gyeongsangbukdo_Goryeong'],
  ['gbgm', 'Gyeongsangbukdo', '4719000000_Gyeongsangbukdo_Gumi'],
  ['gbgc', 'Gyeongsangbukdo', '4715000000_Gyeongsangbukdo_Gimcheon'],
  ['gbmg', 'Gyeongsangbukdo', '4728000000_Gyeongsangbukdo_Mungyeong'],
  ['gbbh', 'Gyeongsangbukdo', '4792000000_Gyeongsangbukdo_Bonghwa'],
  ['gbsj', 'Gyeongsangbukdo', '4725000000_Gyeongsangbukdo_Sangju'],
  ['gbse', 'Gyeongsangbukdo', '4784000000_Gyeongsangbukdo_Seongju'],
  ['gbad', 'Gyeongsangbukdo', '4717000000_Gyeongsangbukdo_Andong'],
  ['gbyd', 'Gyeongsangbukdo', '4777000000_Gyeongsangbukdo_Yeongdeok'],
  ['gbyy', 'Gyeongsangbukdo', '4776000000_Gyeongsangbukdo_Yeongyang'],
  ['gbyj', 'Gyeongsangbukdo', '4721000000_Gyeongsangbukdo_Yeongju'],
  ['gbyc', 'Gyeongsangbukdo', '4723000000_Gyeongsangbukdo_Yeongcheon'],
  ['gbye', 'Gyeongsangbukdo', '4790000000_Gyeongsangbukdo_Yecheon'],
  ['gbuj', 'Gyeongsangbukdo', '4793000000_Gyeongsangbukdo_Uljin'],
  ['gbus', 'Gyeongsangbukdo', '4773000000_Gyeongsangbukdo_Uiseong'],
  ['gbcd', 'Gyeongsangbukdo', '4782000000_Gyeongsangbukdo_Cheongdo'],
  ['gbcs', 'Gyeongsangbukdo', '4775000000_Gyeongsangbukdo_Cheongsong'],
  ['gbcg', 'Gyeongsangbukdo', '4785000000_Gyeongsangbukdo_Chilgok'],
  ['gbpn', 'Gyeongsangbukdo', '4711100000_Gyeongsangbukdo_Pohang_Nam'],
  ['gbpb', 'Gyeongsangbukdo', '4711300000_Gyeongsangbukdo_Pohang_Buk'],

  ['sjtp', 'Korea', '3600000000_Sejong'],
  ['sjsj', 'Sejong', '3611000000_Sejong_Sejong'],

  ['ustp', 'Korea', '3100000000_Ulsan'],
  ['usna', 'Ulsan', '3114000000_Ulsan_Nam'],
  ['usdo', 'Ulsan', '3117000000_Ulsan_Dong'],
  ['usbu', 'Ulsan', '3120000000_Ulsan_Buk'],
  ['usuj', 'Ulsan', '3171000000_Ulsan_Ulju'],
  ['usju', 'Ulsan', '3111000000_Ulsan_Jung'],

  ['jntp', 'Korea', '4600000000_Jeollanamdo'],
  ['jngj', 'Jeollanamdo', '4681000000_Jeollanamdo_Gangjin'],
  ['jngh', 'Jeollanamdo', '4677000000_Jeollanamdo_Goheung'],
  ['jngs', 'Jeollanamdo', '4672000000_Jeollanamdo_Gokseong'],
  ['jngy', 'Jeollanamdo', '4623000000_Jeollanamdo_Gwangyang'],
  ['jngr', 'Jeollanamdo', '4673000000_Jeollanamdo_Gurye'],
  ['jnnj', 'Jeollanamdo', '4617000000_Jeollanamdo_Naju'],
  ['jndy', 'Jeollanamdo', '4671000000_Jeollanamdo_Damyang'],
  ['jnmp', 'Jeollanamdo', '4611000000_Jeollanamdo_Mokpo'],
  ['jnma', 'Jeollanamdo', '4684000000_Jeollanamdo_Muan'],
  ['jnbs', 'Jeollanamdo', '4678000000_Jeollanamdo_Boseong'],
  ['jnsc', 'Jeollanamdo', '4615000000_Jeollanamdo_Suncheon'],
  ['jnys', 'Jeollanamdo', '4613000000_Jeollanamdo_Yeosu'],
  ['jnyg', 'Jeollanamdo', '4687000000_Jeollanamdo_Yeonggwang'],
  ['jnyn', 'Jeollanamdo', '4683000000_Jeollanamdo_Yeongam'],
  ['jnwd', 'Jeollanamdo', '4689000000_Jeollanamdo_Wando'],
  ['jnjs', 'Jeollanamdo', '4688000000_Jeollanamdo_Jangseong'],
  ['jnjh', 'Jeollanamdo', '4680000000_Jeollanamdo_Jangheung'],
  ['jnjd', 'Jeollanamdo', '4690000000_Jeollanamdo_Jindo'],
  ['jnhp', 'Jeollanamdo', '4686000000_Jeollanamdo_Hampyeong'],
  ['jnhn', 'Jeollanamdo', '4682000000_Jeollanamdo_Haenam'],
  ['jnhs', 'Jeollanamdo', '4679000000_Jeollanamdo_Hwasun'],

  ['jbtp', 'Korea', '5200000000_Jeollabukdo'],
  ['jbgc', 'Jeollabukdo', '5279000000_Jeollabukdo_Gochang'],
  ['jbgs', 'Jeollabukdo', '5213000000_Jeollabukdo_Gunsan'],
  ['jbgj', 'Jeollabukdo', '5221000000_Jeollabukdo_Gimje'],
  ['jbnw', 'Jeollabukdo', '5219000000_Jeollabukdo_Namwon'],
  ['jbmj', 'Jeollabukdo', '5273000000_Jeollabukdo_Muju'],
  ['jbba', 'Jeollabukdo', '5280000000_Jeollabukdo_Buan'],
  ['jbsc', 'Jeollabukdo', '5277000000_Jeollabukdo_Sunchang'],
  ['jbwj', 'Jeollabukdo', '5271000000_Jeollabukdo_Wanju'],
  ['jbis', 'Jeollabukdo', '5214000000_Jeollabukdo_Iksan'],
  ['jbim', 'Jeollabukdo', '5275000000_Jeollabukdo_Imsil'],
  ['jbjs', 'Jeollabukdo', '5274000000_Jeollabukdo_Jangsu'],
  ['jbdj', 'Jeollabukdo', '5211300000_Jeollabukdo_Jeonju_Deokjin'],
  ['jbws', 'Jeollabukdo', '5211100000_Jeollabukdo_Jeonju_Wansan'],
  ['jbje', 'Jeollabukdo', '5218000000_Jeollabukdo_Jeongeup'],
  ['jbja', 'Jeollabukdo', '5272000000_Jeollabukdo_Jinan'],

  ['jjtp', 'Korea', '5000000000_Jejudo'],
  ['jjjj', 'Jejudo', '5011000000_Jejudo_Jeju'],
  ['jjsp', 'Jejudo', '5013000000_Jejudo_Seogwipo'],

  ['cntp', 'Korea', '4400000000_Chungcheongnamdo'],
  ['cngr', 'Chungcheongnamdo', '4425000000_Chungcheongnamdo_Gyeryong'],
  ['cngj', 'Chungcheongnamdo', '4415000000_Chungcheongnamdo_Gongju'],
  ['cngs', 'Chungcheongnamdo', '4471000000_Chungcheongnamdo_Geumsan'],
  ['cnns', 'Chungcheongnamdo', '4423000000_Chungcheongnamdo_Nonsan'],
  ['cndj', 'Chungcheongnamdo', '4427000000_Chungcheongnamdo_Dangjin'],
  ['cnbr', 'Chungcheongnamdo', '4418000000_Chungcheongnamdo_Boryeong'],
  ['cnby', 'Chungcheongnamdo', '4476000000_Chungcheongnamdo_Buyeo'],
  ['cnss', 'Chungcheongnamdo', '4421000000_Chungcheongnamdo_Seosan'],
  ['cnsc', 'Chungcheongnamdo', '4477000000_Chungcheongnamdo_Seocheon'],
  ['cnas', 'Chungcheongnamdo', '4420000000_Chungcheongnamdo_Asan'],
  ['cnys', 'Chungcheongnamdo', '4481000000_Chungcheongnamdo_Yesan'],
  ['cndn', 'Chungcheongnamdo', '4413100000_Chungcheongnamdo_Cheonan_Dongnam'],
  ['cnsb', 'Chungcheongnamdo', '4413300000_Chungcheongnamdo_Cheonan_Seobuk'],
  ['cncy', 'Chungcheongnamdo', '4479000000_Chungcheongnamdo_Cheongyang'],
  ['cnta', 'Chungcheongnamdo', '4482500000_Chungcheongnamdo_Taean'],
  ['cnhs', 'Chungcheongnamdo', '4480000000_Chungcheongnamdo_Hongseong'],

  ['cbtp', 'Korea', '4300000000_Chungcheongbukdo'],
  ['cbgs', 'Chungcheongbukdo', '4376000000_Chungcheongbukdo_Goesan'],
  ['cbdy', 'Chungcheongbukdo', '4380000000_Chungcheongbukdo_Danyang'],
  ['cbbe', 'Chungcheongbukdo', '4372000000_Chungcheongbukdo_Boeun'],
  ['cbyd', 'Chungcheongbukdo', '4374000000_Chungcheongbukdo_Yeongdong'],
  ['cboc', 'Chungcheongbukdo', '4373000000_Chungcheongbukdo_Okcheon'],
  ['cbes', 'Chungcheongbukdo', '4377000000_Chungcheongbukdo_Eumseong'],
  ['cbje', 'Chungcheongbukdo', '4315000000_Chungcheongbukdo_Jecheon'],
  ['cbjp', 'Chungcheongbukdo', '4374500000_Chungcheongbukdo_Jeungpyeong'],
  ['cbjc', 'Chungcheongbukdo', '4375000000_Chungcheongbukdo_Jincheon'],
  ['cbsd', 'Chungcheongbukdo', '4311100000_Chungcheongbukdo_Cheongju_Sangdang'],
  ['cbsw', 'Chungcheongbukdo', '4311200000_Chungcheongbukdo_Cheongju_Seowon'],
  ['cbcw', 'Chungcheongbukdo', '4311400000_Chungcheongbukdo_Cheongju_Cheongwon'],
  ['cbhd', 'Chungcheongbukdo', '4311300000_Chungcheongbukdo_Cheongju_Heungdeok'],
  ['cbcj', 'Chungcheongbukdo', '4313000000_Chungcheongbukdo_Chungju']
]
var yearMap = [
  ['a', '2024'], ['b', '2025'], ['c', '2026'], ['d', '2027'], ['e', '2028'], ['f', '2029'], ['g', '2030'], ['h', '2031'], ['i', '2032'],
  ['j', '2033'], ['k', '2034'], ['l', '2035']  
]
var monthMap = [
  ['a', '01'], ['b', '02'], ['c', '03'], ['d', '04'], ['e', '05'], ['f', '06'], ['g', '07'], ['h', '08'], ['i', '09'], ['j', '10'], ['k', '11'], ['l', '12']  
]

//2022년 2월 1일부터 현재까지의 년차 계산
var launchDate = new Date(2022, 1, 1);
var currentDate = new Date();
var yearsDifference = currentDate.getFullYear() - launchDate.getFullYear();

String.prototype.phoneNoRep = function()
{
    const str   = this;
    return str.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-");
}

function checkMobile(){
	var varUA = UserAgent.toLowerCase(); //userAgent 값 얻기
	if ( varUA.indexOf('android') > -1) {
		//안드로이드
		return "android";
	} else if ( varUA.indexOf("iphone") > -1 || varUA.indexOf("ipad") > -1 || varUA.indexOf("ipod") > -1 ) {
		//IOS
		return "ios";
	} else if( varUA.indexOf("macintosh") > -1 ){
		//매킨토시 외
		return "mac";
	} else if( varUA.indexOf("window") > -1 ){
		//윈도우 외
		return "window";
	} else {
    return "other";
  }
}

if (UserAgent.match(/iPhone|ipad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null)
{
  if(scr_width < scr_height){
    isMobile = true
  }
}

var connectionOS = ""
var connectionWebApp = ""

function connectionInfo(){
  if (checkMobile() == "android"){
    connectionOS = "Android"
  }
  else if (checkMobile() == "ios"){
    connectionOS = "iOS"
  }
  else if (checkMobile() == "window"){
    connectionOS = "Windows"
  }
  else if (checkMobile() == "mac"){
    connectionOS = "Macintosh"
  }
  else{
    connectionOS = "Others"
  }

  if(UserAgent.indexOf('inApp') > -1 || UserAgent.indexOf('_iOS_App') > -1 ){
    connectionWebApp = "App"
  }
  else{
    connectionWebApp = "Web"
  }
}

connectionInfo()

const tlgm_token = "7006157322:AAFF0FeURUed_OgSxpIbZGGTYjiB9ZifZsI"
const tlgm_sendto = "1572186775"

function sendTelegram_single_message(comment){
	var tlgm_url = "https://api.telegram.org/bot" + tlgm_token + "/sendMessage?"
	var tlgm_msg = comment
  tlgm_msg = tlgm_msg.replaceAll("<br>", "%0A")
  //tlgm_msg = tlgm_msg.replaceAll("\n", "%0A")  

	var w_date_set = new Date()
	var w_date_str = w_date_set.getFullYear() + "-" + dateReturn((w_date_set.getMonth()+1)) + "-" + dateReturn(w_date_set.getDate()) + ", "
			+ dateReturn(w_date_set.getHours()) + ":" + dateReturn(w_date_set.getMinutes()) + ":" + dateReturn(w_date_set.getSeconds())

	tlgm_msg += "%0A"	
	tlgm_msg += "ㆍ " + w_date_str

	var request_tlgm_url = tlgm_url + "chat_id=" + tlgm_sendto + "&parse_mode=HTML" + "&text=" + tlgm_msg

	fetch(request_tlgm_url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.catch(error => {
	  console.log(error)
	})
}

function sendTelegram_blog(comment){
	var current_region = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
	var current_region_id = selectedSubRegion

	var tlgm_url = "https://api.telegram.org/bot" + tlgm_token + "/sendMessage?"

	var tlgm_msg = "리얼포스팅이 등록되었습니다!" + "%0A%0A"

	tlgm_msg += "[" + current_region + "]" + "%0A"
	tlgm_msg += "(" + current_region_id + ")" + "%0A%0A"

	var w_date_set = new Date()
	var w_date_str = w_date_set.getFullYear() + "-" + dateReturn((w_date_set.getMonth()+1)) + "-" + dateReturn(w_date_set.getDate()) + ", "
			+ dateReturn(w_date_set.getHours()) + ":" + dateReturn(w_date_set.getMinutes()) + ":" + dateReturn(w_date_set.getSeconds())

	tlgm_msg += "ㆍComplex : " + current_apt_name + "%0A"
	tlgm_msg += "ㆍCode : " + comment[1] + "%0A"
	tlgm_msg += "ㆍTitle : " + comment[2] + "%0A"
	tlgm_msg += "ㆍURL : " + comment[3] + "%0A"
	tlgm_msg += "ㆍBy : " + comment[4] + "%0A"
	tlgm_msg += "ㆍDate : " + w_date_str + "%0A"
	tlgm_msg += "ㆍURL : " + shareURL + "%0A"

	var request_tlgm_url = tlgm_url + "chat_id=" + tlgm_sendto + "&parse_mode=HTML" + "&text=" + tlgm_msg

	fetch(request_tlgm_url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.catch(error => {
	  console.log(error)
	})
}

function sendTelegram_message(comment){
	var current_region = shortRegionName( $("#sido option:selected").text() + " " + $("#gungu option:selected").text() );
	var current_region_id = selectedSubRegion

	var tlgm_url = "https://api.telegram.org/bot" + tlgm_token + "/sendMessage?"
	var tlgm_msg = "[" + current_region + "]" + "%0A"
	tlgm_msg += "(" + current_region_id + ")" + "%0A%0A"

	var comment_arr = Object.entries(comment)
	if(comment_arr.length < 2){
	  var w_email = comment_arr[0][1]['email']
	  var w_comment = comment_arr[0][1]['comment']
	  var w_date = comment_arr[0][1]['written']
	  var w_complex_name = comment_arr[0][1]['complex_name']
	  var w_complex_code = comment_arr[0][1]['complex_code']
	}
	else{
	  var w_email = comment['email']
	  var w_comment = comment['comment']
	  var w_date = comment['written']
	  var w_complex_name = comment['complex_name']
	  var w_complex_code = comment['complex_code']
	}
	var w_date_set = new Date(w_date)
	var w_date_str = w_date_set.getFullYear() + "-" + dateReturn((w_date_set.getMonth()+1)) + "-" + dateReturn(w_date_set.getDate()) + ", "
			+ dateReturn(w_date_set.getHours()) + ":" + dateReturn(w_date_set.getMinutes()) + ":" + dateReturn(w_date_set.getSeconds())

	w_comment = w_comment.replaceAll("\n", "%0A")
	w_comment = w_comment.replaceAll("<br>", "%0A")      

	tlgm_msg += "ㆍ " + w_email + "%0A"
	tlgm_msg += "ㆍ " + w_complex_name + "%0A"
	tlgm_msg += "ㆍ " + w_complex_code + "%0A"
	tlgm_msg += "ㆍ " + w_comment + "%0A"
	tlgm_msg += "ㆍ " + w_date_str + "%0A"
	tlgm_msg += "ㆍ " + shareURL + "%0A"

	var request_tlgm_url = tlgm_url + "chat_id=" + tlgm_sendto + "&parse_mode=HTML" + "&text=" + tlgm_msg

	fetch(request_tlgm_url, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' }
	})
	.then(res => res.json())
	.catch(error => {
	  console.log(error)
	})
}

let modalStack = []

function openModal(modalId) {  
  $(`#${modalId}`).modal('show');
  modalStack.push(modalId);
  history.pushState({ modal: modalId }, '', '');

  //console.log(modalStack)
}

function closeModal(modalId) {
  $(`#${modalId}`).modal('hide');

  //modalID가 'appDownloadModal'인 경우, 세션스토리지 저장
  if(modalId === 'appDownloadModal') {
    sessionStorage.setItem('appDownloadModalShown', 'true');    
  }
  
  // 모달이 닫혔을 때 스택에서 제거
  const idx = modalStack.lastIndexOf(modalId);
  if (idx !== -1) {
    modalStack.splice(idx, 1);
  }
  //console.log(modalStack)
}

window.addEventListener('popstate', (event) => {
    if (history.state && history.state.radarOpen) {
      history.back();
      return
    }

    const modalId = modalStack.pop();
    if (modalId) {
      $(`#${modalId}`).modal('hide');
      return;
    }
});

function deepCopy(object) {
  if (object === null || typeof object !== "object") {
    return object;
  } // 객체인지 배열인지 판단
  const copy = Array.isArray(object) ? [] : {};
  for (let key of Object.keys(object)) {
    copy[key] = deepCopy(object[key]);
  }
  return copy;
}

function cookieVal(cookieName){
  if($.cookie(cookieName) != undefined){
    return $.cookie(cookieName)
  }
  return 0      
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function countUp(pageName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/DayCount"] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
}

function regionCountUp(pageName, regionName) {
  const updates = {};  
  updates["DailyConnection/" + today_str + "/" + pageName + "/region/" + regionName] = firebase.database.ServerValue.increment(1);    
  firebase.database().ref().update(updates);
} 

function setGrade(score){
  complex_grade = ""
  if(login_status){
    if(score >= 75){
      complex_grade = "S+"
    }
    else if(score < 75 && score >= 70){
      complex_grade = "S"
    }
    else if(score < 70 && score >= 65){
      complex_grade = "A+"
    }
    else if(score < 65 && score >= 60){
      complex_grade = "A"
    }
    else if(score < 60 && score >= 55){
      complex_grade = "A-"
    }
    else if(score < 55 && score >= 50){
      complex_grade = "B+"
    }
    else if(score < 50 && score >= 45){
      complex_grade = "B"
    }
    else if(score < 45 && score >= 40){
      complex_grade = "B-"
    }
    else if(score < 40 && score >= 35){
      complex_grade = "C+"
    } 
    else if(score < 35 && score >= 30){
      complex_grade = "C"
    }                    
    else{
      complex_grade = "C-"
    }
  }
  else{
    if(score >= 75){
      complex_grade = "S"
    }
    else if(score < 75 && score >= 70){
      complex_grade = "S"
    }
    else if(score < 70 && score >= 55){
      complex_grade = "A"
    }
    else if(score < 55 && score >= 40){
      complex_grade = "B"
    }
    else{
      complex_grade = "C"
    }
  }
  return complex_grade
}

function share_dict(share_dict){
  this_title = share_dict['title']
  this_text = share_dict['content']  
  this_url = share_dict['url']
  this_text_all = share_dict['all_content']

 if (navigator.share) {
    navigator.share({
      title: this_titl,
      text: this_text_all,
      url: this_url
    }).then(() => {
      console.log('Thanks for sharing!');
    })
    .catch(console.error);
  } else {
    // fallback
    shareDialog.classList.add('is-open');
  } 
}

function share(shareTitle, shareText, shareURL){
  shareText = shareText.replaceAll('<br>', '\n')

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareURL
    }).then(() => {
      console.log('Thanks for sharing!');
    })
    .catch(console.error);
  } else {
    // fallback
    shareDialog.classList.add('is-open');
  }
}

function kakaoShare_dict(share_dict) {
  this_title = share_dict['title']
  this_text = share_dict['content']  
  this_url = share_dict['url']
  this_text_all = share_dict['all_content']

  Kakao.Share.sendDefault({    
    objectType: 'text',
    text: this_text,    
    link: {
      mobileWebUrl: this_url,
      webUrl: this_url,
    },    
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: this_url,
          webUrl: this_url,
        },
      },
      {
        title: '앱으로 이동',
        link: {
          androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
        },
      },
    ]    
  });
}

function kakaoShare(shareTitle, shareText, shareURL) {
  Kakao.Share.sendDefault({    
    objectType: 'text',
    text: shareText,    
    link: {
      mobileWebUrl: shareURL,
      webUrl: shareURL,
    },    
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL,
          webUrl: shareURL,
        },
      },
      {
        title: '앱으로 이동',
        link: {
          androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
        },
      },
    ]    
  });
}

function kakaoShareButton(shareTitle, shareText, shareURL) {
  Kakao.Link.createDefaultButton({
    container: '#kakao-link-btn',
    objectType: 'text',
    text: shareTitle + shareText,
    link: {
      mobileWebUrl: shareURL,
      webUrl: shareURL,
    },
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: shareURL,
          webUrl: shareURL,
        },
      },
      {
        title: '앱으로 이동',
        link: {
          androidExecutionParams: 'https://play.google.com/store/apps/details?id=com.aptrank.app'          
        },
      },
    ]
  });
}

function CopyToClipboard(copied_text, msg_pop){
  var txt = copied_text
  var t = document.createElement("textarea");
  t.value = txt;
  document.body.appendChild(t);  
  t.select();
  t.focus();
  document.execCommand('copy');
  document.body.removeChild(t);

  toastr.options = {
    closeButton: false,
    progressBar: false,
    showMethod: 'fadeIn',
    closeMethod: 'fadeOut',
    positionClass: "toast-bottom-center",
    timeOut: 1000
  };
  output = msg_pop
  toastr.success(output);
}

function toastMessage(msg_pop, delayTime){
  toastr.options = {
    closeButton: false,
    progressBar: false,
    showMethod: 'fadeIn',
    closeMethod: 'fadeOut',
    positionClass: "toast-top-center",
    timeOut: delayTime
  };
  output = msg_pop
  toastr.success(output);
}

function CopyToClipboard2(copied_text, msg_pop){
  var txt = copied_text

  window.navigator.clipboard.writeText(txt).then(() => {
    toastr.options = {
      closeButton: false,
      progressBar: false,
      showMethod: 'fadeIn',
      closeMethod: 'fadeOut',
      positionClass: "toast-bottom-center",
      timeOut: 1000
    };
    output = msg_pop
    toastr.success(output);
  })
}

function openOuterLink(url){  
  if(checkMobile() == "ios"){
    window.location.href = url
  }
  else{
    window.open(url)
  }  
}

function openExternalLink(url){  
  window.location.href = url  
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openExternalLinkWithLoading(url, targetMenu){
  $('body').append("<div id='pageLoadingBack'><div class='spinner-grow text-pageLoading' role='status'></div><div style='font-size: 0.85em; color: white'><br>페이지 이동 중입니다</div></div>")  
  //targetMenu가 currentMenu와 같으면 새로고침을 함
  if(currentMenu == targetMenu){
    location.reload()
  }
  else{
    window.location.href = url
  }
}

function openAptrank(){
  aURL = "https://www.realrankus.com/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openAptrankTHEME(){
  aURL = "https://www.realrankus.com/theme/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */   
}

function openOprank(){
  aURL = "https://www.realrankus.com/op/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */ 
}
function openAptrankBIZ2(){
  aURL = "https://www.realrankus.com/biz/index.html"
  if(checkMobile() == "ios"){
    window.location.href = aURL
  }
  else{
    window.open(aURL)
  }
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}

function openAptrankBIZ(){
  aURL = "https://www.realrankus.com/biz/index.html" + "?reg=" + selectedRegion +"&sub=" + selectedSubRegion
  location.href = aURL
  /*
  if(checkMobile() == "ios"){
    window.location.href = aURL
  }
  else{
    window.open(aURL)
  }
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankNEWS(){
  aURL = "https://www.realrankus.com/newsinfo/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankPRICE(){
  aURL = "https://www.realrankus.com/price/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}
function openAptrankMoneyFlow(){
  aURL = "https://www.realrankus.com/moneyflow/index.html"
  location.href = aURL
  /*
  if ( navigator.platform ) {
      if ( pcDevice.indexOf(navigator.platform.toLowerCase()) < 0 ) {
        location.href = aURL
      } else {
        window.open(aURL)
      }
  }
  */
}

function setBottomMenu(){
  bottomMenu_html = `
    <div id='bottom_memu_wrapper'>
      <div class='bottom_tab' id='tab1' onClick='openExternalLinkWithLoading("https://www.realrankus.com", "aptrank")'>아파트분석</div>
      <div class='bottom_tab' id='tab2' onClick='openExternalLinkWithLoading("https://www.realrankus.com/price", "aptrank_price")'>실거래가</div>
      <div class='bottom_tab' id='tab6' onClick='openExternalLinkWithLoading("https://www.realrankus.com/biz", "aptrank_biz")'>지역분석</div>
      <div class='bottom_tab' id='tab9' onClick='openExternalLinkWithLoading("https://www.realrankus.com/cityclass", "cityclass")'>급지표</div>
      <div class='bottom_tab' id='tab8' onClick='openExternalLinkWithLoading("https://www.realrankus.com/moneyflow", "moneyflow")'>시장지표</div>      
      <div class='bottom_tab' id='tab3' onClick='openExternalLinkWithLoading("https://www.realrankus.com/theme", "aptrank_theme")'>테마검색</div>      
      <div class='bottom_tab' id='tab5' onClick='openExternalLinkWithLoading("https://www.realrankus.com/newsinfo", "aptrank_news")'>뉴스</div>      
      <div class='bottom_tab' id='tab7' onClick='openExternalLinkWithLoading("https://www.realrankus.com/priceCal", "aptrank_priceCal")'>분양가계산</div>
      <div class='bottom_tab' id='tab4' onClick='openExternalLinkWithLoading("https://www.realrankus.com/op", "aptrank_op")'>오피스텔분석</div>
    </div>
  `
  $('#linkToAptrank_bottom').html(bottomMenu_html)
  var tabWidth = 75
  var bottom_menu_width = (tabWidth * 9) + "px"
  //$('.bottom_tab').css({'width' : tabWidth + 'px'})
  if(isMobile){
    $('#bottom_memu_wrapper').css({'width' : bottom_menu_width, 'overflow' : 'auto'})
  }  
  setupBottomMenu(currentMenu)
}

function setupBottomMenu(currentMenu){
  var selectedClass = ""
  var bgColor = "#e31939"

  if(currentMenu == "aptrank"){
     selectedClass = "#tab1"
     bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_price"){
     selectedClass = "#tab2"
     bgColor = "#e31939"
  }  
  if(currentMenu == "aptrank_theme"){
    selectedClass = "#tab3"
    bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_op"){
    selectedClass = "#tab4"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_news"){
    selectedClass = "#tab5"
    bgColor = "#e31939"
  }
  if(currentMenu == "aptrank_biz"){
    selectedClass = "#tab6"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_priceCal"){
    selectedClass = "#tab7"
    bgColor = "#162235"
  }
  if(currentMenu == "moneyflow"){
    selectedClass = "#tab8"
    bgColor = "#162235"
  }
  if(currentMenu == "cityclass"){
    selectedClass = "#tab9"
    bgColor = "#162235"
  }
  if(currentMenu == "aptrank_Guider"){
    selectedClass = ""
    bgColor = "#162235"
  }
  
  $(selectedClass).css({'background' : bgColor, 'color' : 'white'})
  //$(selectedClass).prop('onclick', '').unbind('click');
  $(".bottom_tab").css({'border-top': "2px solid " + bgColor})

  //var scrollLeft = $(selectedClass).offset().left  
  //$("#linkToAptrank_bottom").scrollLeft(scrollLeft - 170);

  var scrollLeft = $(selectedClass).offset().left - $('#linkToAptrank_bottom').width() / 2 + $(selectedClass).width() / 2
  if(scrollLeft == undefined){
    scrollLeft = 0
  }
  $("#linkToAptrank_bottom").scrollLeft(scrollLeft);

  //PC 화면에서 innerHeight가 하단Bar를 수용할 수 없으면 표시하지 않음 (2024-01-09)

  var heightMargin = 0
  if(currentMenu == "aptrank_biz"){
    heightMargin = 1005
  }
  if(currentMenu == "aptrank_priceCal"){
    heightMargin = 1030
  }
  if(currentMenu == "moneyflow"){
    heightMargin = 1000
  }
  if(currentMenu == "cityclass"){
    heightMargin = 986
  }

  if(!isMobile && (currentMenu == "aptrank_biz" || currentMenu == "aptrank_priceCal" || currentMenu == "moneyflow" || currentMenu == "cityclass")){
    if(window.innerHeight <= heightMargin){
      $("#linkToAptrank_bottom").css({"display":"none"})
    }
    else{
      $("#linkToAptrank_bottom").css({"width":"100%", "z-index":"150"})
    }
    let delay = 150;
    let timer = null;
    $(window).on('resize', function(){      
      clearTimeout(timer);
      timer = setTimeout(function(){
        if (window.innerHeight > heightMargin) {
          $("#linkToAptrank_bottom").css({"display":"inline-block", "z-index":"150"})
        }
        if (window.innerHeight <= heightMargin) {
          $("#linkToAptrank_bottom").css({"display":"none"})
        }
      }, delay);
    });
  }
}

function setAppDownloadModal(){
  appDownloadLink = ""
  if(connectionOS == "iOS" && connectionWebApp == "Web"){
    appDownloadLink = "https://apps.apple.com/kr/app/%EB%A6%AC%EC%96%BC%EB%9E%AD%EC%BB%A4%EC%8A%A4/id6448044104"    
  }
  else if(connectionOS == "Android" && connectionWebApp == "Web"){
    appDownloadLink = "https://play.google.com/store/apps/details?id=com.aptrank.app"
  }
  else{
    return
  }

  //세션스토리지에 앱다운로드 모달을 띄운 기록이 있으면 띄우지 않음
  if(sessionStorage.getItem('appDownloadModalShown')) {
    return
  }

  appDownload_html = `      
      <div class="modal fade" id="appDownloadModal" tabindex="-1" role="dialog" aria-labelledby="appDownloadModalLabel" aria-hidden="true" style="z-index: 1100;">      
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content" id="appDownloadModaloutline">
          <div class="modal-body" id="appDownloadModalBody">
            <div><img src="https://www.realrankus.com/apt-rank-152x152.png" width="70px" style="border-radius: 10px;"></div>
            <div id="appDownloadModalDescription">리얼랭커스 앱을 설치하시면,<br>더 넓은 화면으로 볼 수 있어요!
            <br><span style='font-size: 0.75em; color: #999;'>(앱 크기가 5메가도 안 돼요!)</span></div>            
            <div class="app-download-link" id="appDownloadLink" onClick="openOuterLink('${appDownloadLink}')">앱 설치하기</div>
            <div id="appDownloadModalCancel" onClick="closeModal('appDownloadModal')">괜찮아요, 모바일 웹으로 볼게요</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  $('body').append(appDownload_html)  
  $("#appDownloadModaloutline").css({'bottom': (-1)*window.innerHeight/3 + 100 + 'px'})
  //350ms 후에 모달이 올라오도록 설정
  setTimeout(function() {
    openModal("appDownloadModal")
    backdrop = $('#appDownloadModal').next('.modal-backdrop')
    backdrop.css({"z-index" : "1090"})
  }, 350);
  //$(".modal-backdrop").css({"z-index" : "1090"})
}

function setOffcanvasMenu(){  
  if(isMobile == false){       
    $('.offcanvas').css({'width' : '400px'}) //offcanvas    
  }
  else{
    $('.offcanvas').css({'width' : '300px'}) //offcanvas
    $('.offcanvas-body').css({'padding' : '5px'}) //offcanvas    
  }

  /*
  $("div#offcanvasRight.offcanvas").on("show.bs.offcanvas", function () {
    var offcanvas_menu_text = $("#offcanvasRight > .offcanvas-header > #offcanvasRightLabel").text()
    console.log(offcanvas_menu_text)
    if(offcanvas_menu_text == "MENU" || offcanvas_menu_text == "" || offcanvas_menu_text == undefined){
      var NID = getItemWithExpireTime('nLOG')
      if(NID){
        loadData(NID[0], NID[1])
      }
      //console.log(NID)
    }
  });
  */

  $("div.offcanvas").on("show.bs.offcanvas", function () {    
    var offcanvas = this;
    var hash = offcanvas.id;
    window.location.hash = hash;
    window.onhashchange = function () {
      if (!location.hash) {
        $(offcanvas).offcanvas("hide");
      }
    };
    /*
    var NID = getItemWithExpireTime('nLOG')
    if(NID){
      login_status = true
      loadData(NID[0], NID[1])
    }
    console.log(NID)
    */
  });

  offcanvas_html = `
        <div id="offcanvas_menu">
          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">아파트분석</div>
              <div class="offcanvas_sub_menu_description">대한민국 아파트 입지, 리얼랭커스</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/price')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">실거래가</div>
              <div class="offcanvas_sub_menu_description">보기 편한 실거래가, 리얼랭커스PRICE</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/biz')">          
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">지역분석</div>
              <div class="offcanvas_sub_menu_description">지역단위 부동산 시장 현황, 리얼랭커스BIZ</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/cityclass')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">부동산 급지표</div>
              <div class="offcanvas_sub_menu_description">전국의 도시별 백분위표, City Class</div>
            </div>
          </div>
          
          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/moneyflow')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">경제시장지표</div>
              <div class="offcanvas_sub_menu_description">하루 한 번 시장 지표를 읽는 습관, Money Flow</div>
            </div>
          </div>          

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/theme')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">테마검색</div>
              <div class="offcanvas_sub_menu_description">공시 1억, 5층 이하 / 분양권 / 재건축 모아보기</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/newsinfo')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">경제뉴스</div>
              <div class="offcanvas_sub_menu_description">부동산, 금융, 경제 뉴스 모아보기, 리얼랭커스 NEWS</div>
            </div>
          </div> 

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/priceCal')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">분양가계산기</div>
              <div class="offcanvas_sub_menu_description">적정 분양가의 합리적 계산, 분양가 GENERATOR</div>
            </div>
          </div>

          <div class='offcanvas_link' onClick="openExternalLinkWithLoading('https://www.realrankus.com/op')">
            <div class="offcanvas_direction"></div>
            <div class="offcanvas_sub_menu">
              <div class="offcanvas_sub_menu_title">오피스텔분석</div>
              <div class="offcanvas_sub_menu_description">대한민국 오피스텔 입지, 오피스텔랭크</div>
            </div>
          </div>          

        </div>
        <div id="offcanvas_footer_link">
          <div class="offcanvas_footer_icon"><i class="fa-solid fa-circle-exclamation"></i></div>
          <div id="offcanvas_footer1" onClick="showNotice()">공지사항 / 업데이트</div>

          <div class="offcanvas_footer_icon"><i class="fa-solid fa-mug-saucer"></i></div>
          <div id="offcanvas_footer4" onClick="openOuterLink('https://cafe.naver.com/aptrankkr')">네이버 카페</div>

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-youtube"></i></div>
          <div id="offcanvas_footer2" onClick="openOuterLink('https://youtube.com/@realrankus')">유튜브: @realrankus</div>

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-instagram"></i> </div>
          <div id="offcanvas_footer3" onClick="openOuterLink('https://www.instagram.com/realrankus/')">인스타그램: @realrankus</div>         

          <div class="offcanvas_footer_icon"><i class="fa-brands fa-facebook"></i></div>
          <div id="offcanvas_footer5" onClick="openOuterLink('https://www.facebook.com/profile.php?id=61575248181914')">페이스북</div>
        </div>
  `
  offcanvas_android_app_download_html = `
    <div id="offcanvas_app_download">
      <div class="offcanvas_footer_icon"><i class="fa-brands fa-google-play"></i></div>
      <div id="offcanvas_footer6" onClick="openOuterLink('https://play.google.com/store/apps/details?id=com.aptrank.app')">앱 다운로드</div>
    </div>
  `
  offcanvas_iOS_app_download_html = `
    <div id="offcanvas_app_download">
      <div class="offcanvas_footer_icon"><i class="fa-brands fa-app-store-ios"></i></i></div>
      <div id="offcanvas_footer7" onClick="openOuterLink('https://apps.apple.com/kr/app/%EB%A6%AC%EC%96%BC%EB%9E%AD%EC%BB%A4%EC%8A%A4/id6448044104')">앱 다운로드</div>
    </div>
  `
  offcanvas_footer_html = `
    <div id="offcanvas_footer"></div>
  `

  offcanvas_info_html = `
    <div id="offcanvas_company_long">
      <div style='font-size: 1.2em; font-weight: 400; margin-bottom: 10px;'>
        <div class='popupTitle' style='text-align: center; padding-bottom: 1em;'>"${yearsDifference}년 차를 맞이한 지속 가능한 AI 서비스, 리얼랭커스"</div>      
        <div class='notice'><strong>2022년 런칭 이후 1인 기업으로서 꾸준한 데이터 업데이트와 고도화를 통해 시장의 신뢰를 쌓아왔습니다. 서비스의 미래 비전 혹은 협업에 관한 가벼운 커피챗 제안을 기다리고 있습니다.</strong></div>
        <div class='notice' onClick='openOuterLink(\"https://open.kakao.com/me/realrankus\")'>커피챗 : <a href=\"#\">https://open.kakao.com/me/realrankus </a></div>
      </div>
      <hr>
      <div id="company_info_detail">
        <div class="company_info_text">서비스명</div>
        <div>리얼랭커스</div>

        <div class="company_info_text">제휴문의</div>
        <div style='text-decoration:none; color: #888;' onClick='openOuterLink("mailto:aptranking@gmail.com")'>aptranking@gmail.com</div>

      </div>
      <hr>
      <div id='company_CI'>
        <div style='margin-bottom:5px'>ⓒ Copyright 2022. RealRankus All Rights Reserved.</div>        
      </div>
    </div>
  `

  offcanvas_info_html_eng = `
    <div id="offcanvas_company_long">
      <div id="company_info_detail">
        <div class="company_info_text">Company</div>
        <div onClick="openOuterLink('')">리얼랭커스</div>

        <div class="company_info_text">CEO</div>
        <div>김선우</div>

        <div class="company_info_text">Strategic Planner</div>
        <div>원문정</div>

        <div class="company_info_text">Biz Registration No.</div>
        <div>725-86-02829</div>

        <div class="company_info_text">eCommerce License No.</div>
        <div>Je2023-SeoulGangnam-05016ho</div>

        <div class="company_info_text">Contact</div>
        <div style='text-decoration:none; color: #888;' onClick='openOuterLink("mailto:aptranking@gmail.com")'>aptranking@gmail.com</div>

        <div class="company_info_text">Head Office</div>
        <div onClick="openOuterLink('https://naver.me/FiOAp7R4')">7F A113, 11-9, Teheran-ro 77-gil, Gangnam-gu, Seoul</div>
      </div>
      <hr>
      <div id='company_CI'>        
        <div style='margin-bottom:5px'>ⓒ Copyright 2022. RealRankus All Rights Reserved.</div>        
      </div>
    </div>
  `    

  $(".offcanvas-body").html(offcanvas_html)
  //$(".offcanvas-body").append(offcanvas_info_html)
  //connectionOS가 "Android"이고 connectionWebApp가 "Web"이면 구글 플레이스토어 링크 표시
  if(connectionOS == "Android" && connectionWebApp == "Web"){
    $(".offcanvas-body").append(offcanvas_android_app_download_html)
  }
  if(connectionOS == "iOS" && connectionWebApp == "Web"){
    $(".offcanvas-body").append(offcanvas_iOS_app_download_html)
  }

  $(".offcanvas-body").append(offcanvas_footer_html)  

  $(".offcanvas-body").append(offcanvas_info_html)
  setupOffcanvas(currentMenu)
}

window.name='opener';

var naverLogin = new naver.LoginWithNaverId(
	{
		clientId: NAVER_CLIENT_KEY,
		//callbackUrl: "http://127.0.0.1:5500/login/callback.html",
		callbackUrl: "https://www.realrankus.com/login/callback.html",
		isPopup: false,
		loginButton: {color: "green", type: 3, height: 60}
	}
);

/* (4) 네아로 로그인 정보를 초기화하기 위하여 init을 호출 */
naverLogin.init();

function setupOffcanvas(currentMenu){
  localStorage.setItem('pageName', pageName)
  /*
  $('.offcanvas_link').on('mousedown', function(e){
    $(this).addClass('offcanvas_active')
  })
  $('.offcanvas_link').on('mouseleave', function(e){
    $(this).removeClass('offcanvas_active')
  })
  */
  if(currentMenu == "aptrank"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(0).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(0).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(0).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_price"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(1).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(1).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(1).css('color', '#f23351')
  }

  if(currentMenu == "aptrank_biz"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(2).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(2).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(2).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "cityclass"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(3).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(3).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(3).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  if(currentMenu == "moneyflow"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(4).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(4).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(4).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }
  
  if(currentMenu == "aptrank_theme"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(5).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(5).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(5).css('color', '#f23351')
  }
  
  if(currentMenu == "aptrank_news"){
    $('.offcanvas-header').css({'background' : '#f23351', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(6).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).css('color', '#f23351')
    $('#offcanvas_menu').children('.offcanvas_link').eq(6).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(6).css('color', '#f23351')
  }
  
  if(currentMenu == "aptrank_priceCal"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(7).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(7).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(7).css('color', '#1b3680')

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }  

  if(currentMenu == "aptrank_op"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_menu').children('.offcanvas_link').eq(8).prop('onclick', '').unbind('click');
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).css('color', '#1b3680')
    $('#offcanvas_menu').children('.offcanvas_link').eq(8).children('.offcanvas_direction').html("▶")
    $('#offcanvas_menu').children('.offcanvas_sub_menu_description').eq(8).css('color', '#1b3680')
  }

  if(currentMenu == "aptrank_Guider"){
    $('.offcanvas-header').css({'background' : '#1b3680', 'color' : 'white'})

    $('#offcanvas_footer_link').children('.offcanvas_footer_icon').eq(0).css('visibility', 'hidden')
    $('#offcanvas_footer_link').children('#offcanvas_footer1').eq(0).css('visibility', 'hidden')
  }

  login_checker()
}

function setOffcanvasProfile(userID, userName, userEmail, userAge, userBirthday, userBirthyear, userGender, userMobile, userNickName, provider){
  temp_email = userEmail
  temp_uid = userID  

  if(isMobile == false){       
    $('.offcanvas').css({'width' : '400px'}) //offcanvas    
  }
  else{
    $('.offcanvas').css({'width' : '300px'}) //offcanvas
    $('.offcanvas-body').css({'padding' : '5px'}) //offcanvas
  }

  var offcanvas_html = ""

  var displayProvider = ""

  if(provider == "NAVER"){    
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#03C75A; border-radius: 5px; margin-top: 5px'>
    <img src='https://www.realrankus.com/image/naver_CI.png' height='15'></div>
    <div style='margin-left: 5px'; margin-top: 5px>네이버</div>
    `    
  }
  if(provider == "KAKAO"){
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#FEE500; border-radius: 50%; margin-top: 5px''>
    <img src='https://www.realrankus.com/image/kakao_CI.png' height='15'></div>
    <div style='margin-left: 5px; margin-top: 5px'>카카오</div>
    `
  }
  if(provider == "APPLE"){    
    displayProvider = `
    <div style='display:grid; align-content:center; justify-content:center; background:#000000; border-radius: 5px; margin-top: 5px'>
    <img src='https://www.realrankus.com/image/apple_CI.png' height='15'></div>
    <div style='margin-left: 5px; margin-top: 5px'>Apple</div>
    ` 
  }

  offcanvas_html += `
  <div id="offcanvas_menu">  
  `

  var displayName = ""
  if(userName == null || userName == undefined || userName == ""){}
  else{
    if(userName.length == 2){
      displayName = userName.substr(0, 1) + "*"
    }
    else if(userName.length >= 3){
      displayName = userName.substr(0, 1)
      for(i = 0 ; i < userName.length-2 ; i++){
        displayName += "*"
      }
      displayName += userName.substr(userName.length-1, 1)
    }
    else{
      displayName = userName
    }

    offcanvas_html += `    
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">이름</div>
          <div class="offcanvas_sub_menu_title">${displayName}</div>
        </div>
      </div>
      `
  }

  if(userNickName == null || userNickName == undefined || userNickName == ""){ }
  else{
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">별명</div>
          <div class="offcanvas_sub_menu_title">${userNickName}</div>
        </div>
      </div>
      `
  }
          
  offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">이메일</div>
          <div class="offcanvas_sub_menu_title">${userEmail}</div>
        </div>
      </div>
      `

  /*
  if(userAge == null || userAge == undefined || userAge == ""){ }
  else{
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">연령</div>
          <div class="offcanvas_sub_menu_title">${userAge}세</div>
        </div>
      </div>
      `
    }
    */

    if(userBirthday == null || userBirthday == undefined || userBirthday == ""){ }
    else{
      var displayBirth = ""
      var displayBirthday = ""
      if(provider == "NAVER"){
        displayBirthday = userBirthday
      }
      if(provider == "KAKAO"){
        displayBirthday = userBirthday.substr(0, 2) + "-" + userBirthday.substr(2, 2)
      }
      
      if(userBirthyear == null || userBirthyear == undefined || userBirthyear == ""){
        displayBirth = displayBirthday        
      }
      else{
        displayBirth = userBirthyear + "-" + displayBirthday
      }
      offcanvas_html += `
        <div class='offcanvas_info'>          
          <div class="offcanvas_sub_menu">
            <div class="offcanvas_sub_menu_description">생년월일</div>
            <div class="offcanvas_sub_menu_title">${displayBirth}</div>
          </div>
        </div>
        `
    }

    if(userGender == null || userGender == undefined || userGender == ""){ }
    else{
      var displayGender = ""
      if(provider == "NAVER"){
        if(userGender == "M"){
          displayGender = "남성"
        }
        else if(userGender == "F"){
          displayGender = "여성"
        }
        else{
          displayGender = "제공 안 함"
        }
      }
      if(provider == "KAKAO"){
        if(userGender == "male"){
          displayGender = "남성"
        }
        else if(userGender == "femail"){
          displayGender = "여성"
        }
        else{
          displayGender = "제공 안 함"
        }
      }
      offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">성별</div>
          <div class="offcanvas_sub_menu_title">${displayGender}</div>
        </div>
      </div>
      `
    }

    /*
    var displayMobile = ""
    if(userMobile == null || userMobile == undefined || userMobile == ""){
      displayMobile = "제공 안 함"
    }
    else{
      displayMobile = userMobile
    }
    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">휴대폰번호</div>
          <div class="offcanvas_sub_menu_title">${displayMobile}</div>
        </div>
      </div>
    `
    */

    offcanvas_html += `
      <div class='offcanvas_info'>        
        <div class="offcanvas_sub_menu">
          <div class="offcanvas_sub_menu_description">로그인 제공</div>
          <div class="offcanvas_sub_menu_title" style='display:grid; grid-template-columns:30px 1fr'>${displayProvider}</div>
        </div>
      </div>
    `    

  $("#offcanvasProfile > .offcanvas-header > #offcanvasRightLabel").html("사용자정보")
  $("#offcanvasProfile > .offcanvas-body").html(offcanvas_html)
  $("#offcanvasProfile > .offcanvas-header").attr({"data-bs-toggle":"offcanvas", "data-bs-target" : "#offcanvasRight", "aria-controls" : "offcanvasRight"})  
}

function numberFormat(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToKorean(number){
  var inputNumber  = number < 0 ? false : number;
  var unitWords    = ['', '만', '억', '조', '경'];
  var splitUnit    = 10000;
  var splitCount   = unitWords.length;
  var resultArray  = [];
  var resultString = '';

  for (var i = 0; i < splitCount; i++){
      var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
      unitResult = Math.floor(unitResult);
      if (unitResult > 0){
          resultArray[i] = unitResult;
      }
  }

  for (var i = 0; i < resultArray.length; i++){
      if(!resultArray[i]) continue;
      resultString = String(numberFormat(resultArray[i])) + unitWords[i] + " " + resultString;
  }

  return resultString;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array
}

function arrayChunk(arr, chunk) {
  // 빈 배열 생성
  const result = [];
  
  for (index=0; index < arr.length; index += chunk) {
    let tempArray;
    // slice() 메서드를 사용하여 특정 길이만큼 배열을 분리함
    tempArray = arr.slice(index, index + chunk);
    // 빈 배열에 특정 길이만큼 분리된 배열을 추가
    result.push(tempArray);
  }
  
  return result;
}

function realrankus_visit(complex, sido, gungu, dong){	
	//firebase의 realrankus_visit에 접속해서 전역변수 'today_str'을 사용하여 db가 없으면 생성한다.
	//today_str하위에 complex, region, dong을 생성하고 해당하는 값을 1씩 증가시킨다.
	//이때, complex, region, dong은 각각의 변수로 받아서 사용한다.
	//이후, 해당하는 값을 1씩 증가시킨다.

	sido = sido.replaceAll(" ", "_")
	gungu = gungu.replaceAll(" ", "_")
	dong = dong.replaceAll(" ", "_")

	//DEFAULT DB
	firebase.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			firebase.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			firebase.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	firebase.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			firebase.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			firebase.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	firebase.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			firebase.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			firebase.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})
	
	firebase.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			firebase.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			firebase.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	//SUB01 DB
	sub01_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub01_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub01_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub01_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub01_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub01_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub01_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub01_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub01_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub01_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub01_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub01_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})
	
	//SUB02 DB
	sub02_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub02_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub02_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub02_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub02_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub02_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub02_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub02_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub02_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub02_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub02_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub02_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})
	
	//SUB03 DB
	sub03_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub03_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub03_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub03_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub03_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub03_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub03_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub03_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub03_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub03_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub03_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub03_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	//SUB04 DB
	sub04_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub04_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub04_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub04_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub04_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub04_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub04_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub04_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub04_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub04_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub04_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub04_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	//SUB05 DB
	sub05_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub05_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub05_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})
	sub05_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub05_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub05_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub05_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub05_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub05_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub05_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub05_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub05_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	//SUB06 DB
	sub06_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub06_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(1)
		}
		else{
			sub06_db.database().ref("realrankus_visit/" + "complex_" + complex + "/" + today_str).set(snapshot.val() + 1)
		}
	})  
  .then(function(){
    setTimeout(function(){
      firebase.database().ref().child("realrankus_visit").child("complex_" + complex).get()
      .then((snapshot) => {
        if(snapshot.exists()){
          visit_obj = snapshot.val()
          visit_count = 0        
          for(var i in visit_obj){
            //날짜가 30일 이전의 날짜보다 큰 경우만 count
            compare_days = Number(i.replaceAll("-", ""))
            if(days_ago_num <= compare_days){
              visit_count += visit_obj[i]
            }
          }
          if(visit_count == 1){          
            $("#visit_complex_" + complex).html(visit_count.toLocaleString() + "명 방문")
            $("#visit_complex_" + complex).animate({opacity: '1', marginTop:'0px'}, 150);            
            $("#complex_visit_info").html("첫 번째 방문이네요!")
          }
          else{          
            $("#visit_complex_" + complex).html(visit_count.toLocaleString() + "명 방문")
            $("#complex_visit_info").html(visit_count.toLocaleString() + "번째 방문이예요!")
          }        
        }
      })
    }, 350)
  })

	sub06_db.database().ref("realrankus_visit/" + sido + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub06_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(1)
		}
		else{
			sub06_db.database().ref("realrankus_visit/" + sido + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub06_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub06_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(1)
		}
		else{
			sub06_db.database().ref("realrankus_visit/" + gungu + "/" + today_str).set(snapshot.val() + 1)
		}
	})

	sub06_db.database().ref("realrankus_visit/" + dong + "/" + today_str).once("value")
	.then(function(snapshot){
		if(snapshot.val() === null){
			sub06_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(1)
		}
		else{
			sub06_db.database().ref("realrankus_visit/" + dong + "/" + today_str).set(snapshot.val() + 1)
		}
	})  
}