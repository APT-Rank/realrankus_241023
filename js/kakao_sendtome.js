  function sendTo() {
    Kakao.Auth.login({
      scope: 'TALK_MESSAGE',
      success: function() {
        Kakao.API.request({
          url: '/v2/api/talk/memo/default/send',
          data: {
            template_object: {
              object_type: 'feed',
              content: {
                title: '리얼랭커스 9월 업데이트 안내',
                image_url:
                  'https://www.realrankus.com/update_202209.jpg',
                link: {
                  mobile_web_url: 'https://www.realrankus.com',
                  web_url: 'https://www.realrankus.com',
                },
              },
              social:{

              },
              buttons: [
                {
                  title: '리얼랭커스',
                  link: {
                    mobile_web_url: 'https://www.realrankus.com',
                    web_url: 'https://www.realrankus.com',
                  },
                },
                {
                  title: '랭크:THEME',
                  link: {
                    mobile_web_url: 'https://www.realrankus.com/theme',
                    web_url: 'https://www.realrankus.com/theme',
                  },
                },
              ],
            },
          },
          success: function(res) {
            alert('success: ' + JSON.stringify(res))
          },
          fail: function(err) {
            alert('error: ' + JSON.stringify(err))
          },
        })
      },
      fail: function(err) {
        alert('failed to login: ' + JSON.stringify(err))
      },
    })
  }
