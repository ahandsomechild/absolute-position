<template>
  <div class="sign-index">
    <div class="top center">
      <div class="left ">
        <span style="cursor: pointer"><i class="el-icon-arrow-left" @click="goBack()"> 返回</i></span>
      </div>
      <span class="text-lg">{{ contract.title }}</span>
      <div class="right pull-right">
        <span style="cursor: pointer" @click="save_draft">保存草稿</span>&nbsp;
        <el-button type="primary" size="mini" class="button-flat" @click="save_img">下一步</el-button>
      </div>
    </div>
    <div class="content">
      <el-col :span="4" class="left border-right">
        <div class="title border-bottom">
          <span class="pull-left">{{ contract.title }}</span>
          <span class="pull-right">{{ actived +1 }}/{{ imgs.length }}</span>
        </div>
        <div class="preview">
          <div :class="{ active: actived===item.num, item: true}" v-for="(item, index) in imgs"
               @click="leftClick(item, index)">
            <img :src="item.path" class="main" alt="">
            <img src="static/img/tag_left.png" v-show="item.isSigned" class="tag" alt="">
            <div :class="{ active: actived===item.num, page: true }">{{ item.num +1 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="16" class="middle border-left border-right">
        <div class="container" id="sign-container" @scroll="cscroll()" ref="container">
          <div class="item"
               @dragover="allowDrop($event)"
               v-for="(item, index) in imgs"
               ref="cimg"
               @drop="droparea($event)"
               :focus="actived===item.num">
            <img :src="item.path" class="main" alt="">
            <div draggable="true" style="cursor: move" class="sign-position center" v-for="(st, ind) in item.signs"
                 @dragstart='drag(ind, $event)'  @drag="draging(ind, $event)"
                 :style="{ left: st.limitx * 100 + '%', top: (st.limity - 0.1)*100 + '%', borderColor: st.color, color: st.color}" ref="sp">
              <i class="el-icon-circle-close-outline pull-right text-lg" title="删除签名" @click="deleteSign(st,ind)"></i>
              <span class="center ellipsis">{{ st.nickname }}签署区域 
                左下({{st.limitx}},{{st.limity}})
                <!-- 右上({{st.rightx}},{{st.righty}}) -->
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="4" class="right border-left">
        <div class="title border-bottom">
          <div class="right-title">
            <span>指定签署位置</span>
          </div>
        </div>
        <div class="container" >
          <div class="poster" v-if="signers[0]">
            <div class="ctop">
              <span>发起方</span>
            </div>
            <div class="ccenter">
              <div class="item" draggable="true" @dragstart="rightDragStart(signers[0], 0,$event)">
                <div class="name">
                  {{ signers[0].nickname }}
                </div>
                <div class="number active">
                  <span title="点击添加签署位置" @click="signclc(signers[0], 0)">签署位置  {{ numbers[0] }}处</span>
                </div>
              </div>
            </div>
          </div>
          <div class="receiver">
            <div class="ctop">
              <span>接收方</span>
            </div>
            <div class="ccenter">
              <div class="item" v-for="(item, index) in signers" v-if="index > 0 " draggable="true" @dragstart="rightDragStart(item, index,$event)">
                <div class="name">
                  {{ item.nickname }}
                </div>
                <div class="number">
                  <span title="点击添加签署位置" @click="signclc(item, index)">签署位置  {{ numbers[index] }}处</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </div>
  </div>
</template>
<script>
  import http from './http'
  import _ from 'lodash'

  export default {
    data() {
      return {
        holder:'',
        contract: [],
        imgs: [],
        signers: [],
        colors: [
          {value: '#E806EB'},
          {value: '#FD9827'},
          {value: '#FF2B08'},
          {value: '#4F9102'},
          {value: '#00E9C5'},
          {value: '#008FE9'},
        ],
        screenX: 0,
        screenY: 0,
        pageX: 0,
        pageY: 0,
        labels: {1: '甲方', 2: '乙方', 3: '丙方', 4: '丁方', 5: '戊方', 6: '己方', 7: '庚方', 8: '辛方', 9: '壬方', 10: '癸方'},
        actived: 0,
        isRightDrag: false, //判断是否是右侧签名拖拽
        draged: null,       //存储被拖拽元素的信息
        containerH: 978, //中间文档高度
        imgH: 978,       //中间图片的高度
        imgW: 649,       //中间图片的宽
        signH: 97.8,         //签名的高度 a4纸高度的0.1
        signW: 162.25,         //签名的宽度 a4纸宽度的0.25
      }
    },
    created: function () {
      this.holder = 13;
      http.get('personal-api/api/personal/usercontract/selectsignport',{ usercontractid: '2', holder: this.holder,ucid:'2'})
        .then(res => {
          this.contract = res.data.content.draftInfo
          this.imgs = res.data.content.imgs
          this.signers = res.data.content.signers
        })

    },
    computed: {
      /**
       * 计算签署区域的数量
       *
       */
      numbers: function () {
        let num = {}
        this.signers.map((item, index) => {
          num[index] = 0
          this.imgs.map((ii) => {
            if (ii.signs) {
              ii.signs.map( (iitem) => {
                if (iitem.signersid === item.signerid) {
                  num[index]++
                }
              } )
            }

          })
        })

        return num
      },
      num1: function () {
        let a = this.imgs

        return a[0].signs
      }
    },
    methods: {
      rightDragStart(item, index, e) {
        this.isRightDrag = true
        this.draged = item
        this.draged.index = index
      },
      dragingsign(item, e) {
        console.log(e)
      },
      /**
       * 点击添加签名
       * @param item
       * @param index
       * @param e 如果是右侧拖拽则传入该事件
       */
      signclc: function(item, index, e) {
        let signObj = {
          num: this.actived ,
          label: item.label,
          id: item.id,
          userid: item.userid,
          nickname: item.nickname,
          signersid: item.signerid,
          limitx: 0,
          limity: 0,
          rightx:0,
          righty:0,
          realx: 0,
          realy: 0,
          done: false,
          actived: false,
          color: this.colors[index].value
        }
        if (!e) {
          //点击自动生成签章区域
          signObj.limitx = this.imgW - this.signW
          signObj.limity = this.imgH / 2
        } else {
          if (e.offsetX >= this.imgW - this.signW/2) {//鼠标移动的位置 大于右边边界位置；防止签名区域超出右边界
            signObj.limitx = this.imgW - this.signW//放置在右边界
          } else if (e.offsetX <= this.signW/2) {//小于左边边界位置
            signObj.limitx = 0//放置在左边界
          } else signObj.limitx = e.offsetX-this.signW/2;//如果签名位置没有超出边界的话就以鼠标在中间为基准

          if (e.offsetY >= this.imgH - this.signH/2) {
            signObj.limity = this.imgH - this.signH
          } else if (e.offsetY <= this.signH/2) {
            signObj.limity = 0
          } else signObj.limity = e.offsetY-this.signH/2;

        }
        signObj.limitx = (signObj.limitx/this.imgW)
        signObj.limity = (signObj.limity/this.imgH+0.1)
        console.log(signObj)
        this.imgs[this.actived].signs.push(signObj)
        if (!this.imgs[this.actived].isSigned) {
          this.imgs[this.actived].isSigned = true
        }

      },
      /**
       * 控制主页面滚动条
       * @param e
       */
      cscroll: function (e) {
        let len = this.$refs.container.scrollTop;
        if (len % this.containerH >= this.imgH / 2) {
          this.actived = Math.floor(len / this.containerH + 1)
        } else {
          this.actived = Math.floor(len / this.containerH )
        }
      },
      goBack: () => window.history.go(-1),

      /**
       * 点击左侧缩略图事件
       * @param item
       * @param index
       */
      leftClick: function (item, index) {
        this.actived = item.num
        if(this.actived == 0){
          this.$refs.container.scrollTop = 0;
        }else {
          this.$refs.container.scrollTop = this.containerH * this.actived
        }

      },
      /**
       * 删除签名区域
       * @param st
       * @param ind
       */
      deleteSign(st, ind) {
        console.log(st)
        this.imgs[st.num].signs.splice(ind, 1)
        this.imgs[st.num].isSigned = this.imgs[st.num].signs.length > 0
      },
      /**
       * 拖动结束后对签名区域进行处理
       * @param index
       * @param e
       */
      // dragend(index, e) {
      //   //x轴移动距离
      //   let xlen = e.pageX - this.pageX
      //   //y轴移动距离
      //   let ylen = e.pageY - this.pageY
      //   console.log('x轴移动距离:'+xlen, 'y轴移动距离'+ylen);
      //   if (xlen + this.draged.limitx >= this.imgW - this.signW) {
      //     this.draged.limitx = this.imgW - this.signW
      //   } else if (xlen + this.draged.limitx <= 0) {
      //     this.draged.limitx = 0
      //   } else this.draged.limitx = xlen/this.imgW + this.draged.limitx
      //   if (ylen + this.draged.limity > this.imgH - this.signH) {
      //     this.draged.limity = this.imgH - this.signH
      //   } else if (ylen + this.draged.limity <= 0) {
      //     this.draged.limity = 0
      //   } else this.draged.limity = ylen/this.imgH + this.draged.limity
      //   this.imgs[this.actived].signs[index].limitx = this.draged.limitx
      //   this.imgs[this.actived].signs[index].limity = this.draged.limity
      //   // console.log(this.draged)
      // },
      draging (index, e) {

      },
      droparea(e) {
        //判断是否是右侧签名拖拽,如果是就直接生成区域
        if (this.isRightDrag) {
          this.signclc(this.draged, this.draged.index, e)
        } else {
          let xlen = e.screenX - this.screenX;
          //y轴移动距离
          let ylen = e.screenY - this.screenY;
          console.log('x轴移动距离:'+xlen, 'y轴移动距离'+ylen);
          //
          if (xlen + this.draged.limitx * this.imgW >= this.imgW - this.signW) {
            this.draged.limitx = (this.imgW - this.signW)/this.imgW
          } else if (xlen + this.draged.limitx * this.imgW <= 0) {
            this.draged.limitx = 0
          } else this.draged.limitx =(xlen + this.draged.limitx * this.imgW)/this.imgW;

          if (ylen + this.draged.limity * this.imgH  > this.imgH) {
            this.draged.limity = 1.00
          } else if (ylen + this.draged.limity * this.imgH <= this.signH) {
            this.draged.limity = 0.1
          } else this.draged.limity = (ylen + this.draged.limity * this.imgH)/this.imgH;
          //转换百分比----------------
          this.draged.limitx = this.draged.limitx;
          this.draged.limity = this.draged.limity;
          console.log(this.draged)

          this.imgs[this.actived].signs[this.draged.index].limitx = this.draged.limitx
          this.imgs[this.actived].signs[this.draged.index].limity = this.draged.limity
        }
      },
      /**
       * 拖动开始
       * @param index
       * @param e
       */
      drag(index, e) {
        // console.log(this.imgs[this.actived].signs[index])
        this.isRightDrag = false
        //设置当前拖动的元素
        this.draged = this.imgs[this.actived].signs[index]
        this.draged.index = index
        //记录鼠标位置
        this.screenX = e.screenX
        this.screenY = e.screenY
      },
      drop(index, e) {
        e.preventDefault();
      },
      allowDrop(e) {
        e.preventDefault()
      },
      /**
       * 保存签名区域
       */
      save_img() {
        let signs = []
        //提交需要的数据格式
        this.imgs.forEach(item => {
          item.signs.forEach(sign => {
            let signarea = {
              signersid: sign.signersid,
              limitx: sign.limitx,
              limity: sign.limity,
              limithight: this.signH,
              limitwidth: this.signW,
              realx: null,
              realy: null,
              realheight: null,
              realwidth: null,
              num: item.num
            }
            signs.push(signarea)
          })
        })
        let data = {contractSign: signs, userContractId: this.$route.params.id}
        http.post('personal-api/api/personal/itext/area', data).then(res => {
          if (res.data.status === 20) {
            this.$store.commit('save_imgs', this.imgs)
            this.$router.push({name: 'contractdoSign', params: {id: res.data.content}})
            this.$message('保存成功')
          }
          this.$message(res.data.message)
        })
      },
      /**
       * 保存草稿
       */
      save_draft() {
        let signs = []
        //提交需要的数据格式
        this.imgs.forEach(item => {
          item.signs.forEach(sign => {
            let signarea = {
              signersid: sign.signersid,
              limitx: sign.limitx/this.imgW,
              limity: sign.limity/this.imgH,
              limithight: this.signH,
              limitwidth: this.signW,
              realx: null,
              realy: null,
              realheight: null,
              realwidth: null,
              num: item.num
            }
            signs.push(signarea)
          })
        })
        let data = {contractSign: signs, userContractId: this.$route.params.id}
        http.post('personal-api/api/personal/save/draft', data).then(res => {
          if (res.data.status === 20) {
            this.$store.commit('save_imgs', this.imgs)
            this.$message('保存成功');
            this.$router.push({name: 'contracts'})
          } else
            this.$message(res.data.message)
        })
      }
    }
  }
</script>
<style lang="less" scoped>
  @import '../common/stylus/base';
  @content-height: 978px; //中间文档的高度
  @content-width: 649px;
  @sign-width: 162.25px;        //签名的宽高
  @sign-height: 97.8px;
  .sign-index {
    .top {
      height: 50px;
      line-height: 50px;
      background-color: #FFD100;
      color: white;
      .left {
        float: left;
        margin-left: 20px;
      }
      .right {
        margin-right: 20px;
        .button-flat {
          width: @btn-width-default;
        }
      }
      span.text-lg {
        color: black;
      }
    }
    .content {

      .left {
        background-color: @color-background-white;
        .title {
          margin: 10px 20px;
          height: 30px;
          color: @font-color-default
        }
        .preview {
          height: 1200px;
          overflow-y: auto;
          .active {
            border: 1px solid @color-orange !important;
          }
          .item {
            position: relative;
            width: 80%;
            margin: 20px auto;
            border: 1px solid @color-gray;
            img.main {

              width: 100%;
              height: 100%;
            }
            .page {
              position: absolute;
              width: 30px;
              height: 20px;
              bottom: 0;
              right: 0;
              font-weight: bold;
              font-size: @font-size-small;
              color: white;
              background-color: @color-gray;
              text-align: center;
              span {
                margin: 0 auto;
              }
            }
            .active {
              background-color: @color-orange;
            }
            img.tag {
              top: 80%;
              position: absolute;
            }
          }
        }
      }
      .middle {
        background-color: @color-background-base;
        .container {
          height: 1200px;
          overflow-y: auto;
          position: relative;
          .item {
            width: @content-width;
            height: @content-height;
            margin: 0 auto;
            border: 1px @color-yellow solid;
            position: relative;
            span {
              line-height: @sign-height;
              margin: 0 auto
            }
            i {
              position: absolute;
              right: 0;
              cursor: pointer;
              background: #FFFFFF;
              transform: translate(50%,-50%);
            }
            img.main {
              width: @content-width;
              display: block;
              height: @content-height;
              position: absolute;

            }
            .sign-position {
              position: absolute;
              border-width: 1px;
              border-style: dashed;
              width: @sign-width;
              height: @sign-height;
              opacity: .8;
              border-radius: 6px;
              /*span {*/
              /*color: #FFFFFF;*/
              /*}*/
            }
          }
        }
      }
      .right {
        background-color: @color-background-white;
        height: 100%;
        .title {
          margin: 10px 20px;
          height: 3.63rem;
          color: @font-color-default;
          .right-title{
            .mixin-cz-md;
            border-left: 5px solid #FEB768 ;
            span  {
              color: #333333;
              font-weight: bold;
              font-size: @font-size-medium;
              padding-left: 0.5rem;
            }
          }
          .left {
            border-left: solid 5px @color-orange;
            height: 25px;
            line-height: 25px;
            span {
              margin-left: 10px;
            }
          }
        }
        .container {
          margin: 10px 20px;
          .poster {
            .line-center {
              height: 2rem;
              line-height: 2rem;
              font-size: 0.88rem;

            }
            .ctop {
              .line-center();
              font-size: 1rem;
              margin-top: 1rem;
            }
            .ccenter {
              .item {
                text-align: center;
                .name {
                  .line-center();
                }
                .number {
                  margin: 0 auto 1rem;
                  cursor: move;
                  color: #999999;
                  width: 7.5rem;
                  .line-center();
                  border: 1px solid #999999;
                  &.active {
                    color: #FD9827;
                    border-color: #FD9827;
                  }
                }
              }
            }
            border-bottom: 1px solid @color-gray;
          }
          .receiver {
            .poster();
          }
          .signs {
            .sign-item {
              cursor: move;
              border: 1px dashed #eaeaea;
              border-radius: 4px;
              img {
                width: 100%;
              }
              margin-top: 10px;
            }
          }
        }
      }
    }
  }
</style>
