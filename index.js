const { Client, Intents, Collection, MessageEmbed, CommandInteraction, Permissions, Message, GuildMember } = require('discord.js');
const { RED, GREEN, BLUE } = { RED: "#ff5454", GREEN: "#54ff62", BLUE: "#38e1ff" }
const client = new Client({
   intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES],
   partials: ['MESSAGE', 'CHANNEL', 'USER'],
});
const firebase_module = require('./firebase_function/firebase_database')
const { token, serverid, game_channel_id, prefix } = require('./config.json')
const cooldown = new Collection();
const { convertMS } = require("discordutility");
const time = 1000;


// 게임 기초 변수
var Joined_Players = [];
var Player_Roles = [];
var Vote_Player = [];
var Vote_Done_Players = [];
var Suser = [];

var Night = false;
var IsGameReady = false;
var IsGamePlaying = false;
var IsVoteTime = false;
var IsDie = false;

var Select_DONE = 0;
var Mafia_Count = 0;
var Citizen_Count = 0;

var DisplayUserText = "";

var Police_Select, Doctor_Select, Mafia_Select = [];

var Timer;

// 게임 메시지 출력 변수
var Channel;
const Embed_Title = "마피아"
const Messages = {
   COMMAND_NOT_FOUND_ARGS: { TITLE: Embed_Title, DESCRIPTION: "올바른 인자 값을 입력해주세요" },
   GAME: {
      GAME_NOT_READY: { TITLE: Embed_Title, DESCRIPTION: `게임이 아직 시작되지 않았습니다\n${prefix}마피아 시작 명령어를 통해 게임을 시작시켜주세요` },
      GAME_JOIN: { TITLE: Embed_Title, DESCRIPTION: "님이 게임에 참가하셨습니다" },
      GAME_READY: { TITLE: Embed_Title, DESCRIPTION: `30초 후 게임이 시작됩니다,\n${prefix}마피아 참가 명령어를 통해 게임에 참가해주세요` },
      GAME_PLAYERS_COUNT_ERROR: { TITLE: Embed_Title, DESCRIPTION: "인원이 4명 미만이므로 게임을 시작할 수 없습니다." },
      GAME_END_MESSAGE: { TITLE: Embed_Title, DESCRIPTION: "게임이 종료되었습니다." },
      GAME_PLAYING: { TITLE: Embed_Title, DESCRIPTION: "게임이 이미 시작되었습니다." },
      GAME_READY_ERROR: { TITLE: Embed_Title, DESCRIPTION: "게임이 이미 준비중입니다." },
      GAME_ALREADY_JOIN: { TITLE: Embed_Title, DESCRIPTION: "이미 게임에 참가되어 있습니다." },
      GAME_LEAVE: { TITLE: Embed_Title, DESCRIPTION: "님이 게임을 나왔습니다" },
      GAME_NOT_JOIN_LEAVE: { TITLE: Embed_Title, DESCRIPTION: "게임에 참여하지 않았기에 게임 나가기가 불가능합니다." },
      GAME_START: { TITLE: Embed_Title, DESCRIPTION: "게임이 시작되었습니다." },
      GAME_SET_ROLE: { TITLE: Embed_Title, DESCRIPTION: "각 역할을 랜덤으로 설정하고 있습니다.\n자신의 역할은 개인 메시지로 전달됩니다." },
      GAME_ROLE_SEND: { TITLE: Embed_Title, DESCRIPTION0: "당신의 역할은 ", DESCRIPTION1: "입니다" },
      GAME_DONE_SET_ROLE: { TITLE: "안내", DESCRIPTION: "역할 설정이 완료되었습니다" },
      GAME_NIGHT: { TITLE: "안내", DESCRIPTION: "밤이 되었습니다.\n각 역할별로 지목 할 대상을 개인 메시지로 전송해주세요." },
      NOT_FOUND_PLAYER: { TITLE: "안내", DESCRIPTION: "해당하는 플레이어를 찾을 수 없습니다." },
      GAME_DONE_PLAYER_SELECT: { TITLE: "안내", DESCRIPTION: "해당 플레이어를 지목하였습니다" },
      GAME_ME_SELECT_ERROR: { TITLE: "안내", DESCRIPTION: "자기 자신은 지목할 수 없습니다." },
      GAME_TALK_TIME: { TITLE: "안내", DESCRIPTION: "낮이 되었습니다, 지금부터 2분간 토론 시간이 주어집니다, 자유롭게 대화를 시작해주세요." },
      VOTE_TIME: { TITLE: "안내", DESCRIPTION: "지금부터 투표를 진행합니다\n지목 할 대상을 멘션으로 지목하여 이 채널에 보내주세요" },
      ALREADY_VOTE: { TITLE: "안내", DESCRIPTION: "이미 투표를 완료하였습니다." },
      MAFIA: { TITLE: "안내", DESCRIPTION: "님은 마피아였습니다, 남은 마피아 수 :" },
      NO_MAFIA: { TITLE: "안내", DESCRIPTION: "님은 마피아가 아니였습니다." },
      VOTE_OVERLAP: { TITLE: "안내", DESCRIPTION: "아무도 죽지 않았습니다." },
      NOT_MAFIA: { TITLE: "안내", DESCRIPTION: "님은 마피아가 아닙니다." },
      YES_MAFIA: { TITLE: "안내", DESCRIPTION: "님은 마피아입니다." },
      DIE_FROM_MAFIA: { TITLE: "안내", DESCRIPTION: "님이 마피아에게 살해당하였습니다." },
      HEISMAFIA: { TITLE: "안내", DESCRIPTION: "마피아는 마피아를 죽일 수 없습니다." },
      ALIVEUSER: { TITLE: "안내", DESCRIPTION0: "누군가가 ", DESCRIPTION1: "님을 살렸습니다." },
      NO_DIE_FROM_MAFIA: { TITLE: "안내", DESCRIPTION: "아무도 마피아에게 살해당하지 않았습니다." },
      SNRK_GOTDJ: { TITLE: "안내", DESCRIPTION: "이미 다른 마피아가 지목한 대상입니다." },
      LAST_TALK: { TITLE: "안내", DESCRIPTION: "님, 마지막 발언 기회 15초가 주어집니다." },
      GAME_END_MAFIA_WON: { TITLE: "안내", DESCRIPTION: "게임이 종료되었습니다\n**마피아가 승리하였습니다**" },
      GAME_END_MAFIA_LOSE: { TITLE: "안내", DESCRIPTION: "게임이 종료되었습니다\n**시민이 승리하였습니다**" }

   },
   ERROR: {
      DMOFF: { TITLE: Embed_Title, DESCRIPTION: "개인 메시지 전송이 불가능하여 참가가 불가능합니다." }
   }

}


// 디스코드 함수
client.once('ready', async () => {
   console.log('Ready!');
   client.user.setActivity('!마피아', { type: 'WATCHING' });
   Channel = await client.guilds.cache.get(serverid).channels.cache.get(game_channel_id)
});
client.on('messageCreate', async (message) => {
   if (IsGamePlaying) {
      if (message.channel.type == 'DM') {
         if (!Night) return;
         var EMBED = new MessageEmbed();
         for (var a = 0; a < Vote_Done_Players.length; a++) {
            if (Vote_Done_Players[a] == message.author.id) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.ALREADY_VOTE.TITLE).setDescription(Messages.GAME.ALREADY_VOTE.DESCRIPTION).setColor(RED)] })
         }
         for (var j = 0; j < Player_Roles.length; j++) {

            if (Player_Roles[j].Uid == message.author.id && Player_Roles[j].Role != "시민") {
               await client.guilds.cache.get(serverid).members.fetch({
                  query: message.content,
                  limit: 1
               }).then(async (u) => {
                  var EMBED = new MessageEmbed();
                  if (u.get(u.firstKey()) == undefined) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.NOT_FOUND_PLAYER.TITLE).setDescription(Messages.GAME.NOT_FOUND_PLAYER.DESCRIPTION).setColor(RED)] })
                  var user = await u.get(u.firstKey()).id;
                  if (user == Player_Roles[j].Uid && Player_Roles[j].Role != "의사") return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_ME_SELECT_ERROR.TITLE).setDescription(Messages.GAME.GAME_ME_SELECT_ERROR.DESCRIPTION).setColor(RED)] })
                  const my_role = Player_Roles[j].Role;
                  if (Player_Roles[j].Role == "마피아") {
                     for (var i = 0; i < Player_Roles.length; i++) {
                        if (Player_Roles[i].Uid == user && Player_Roles[i].Role == "마피아") {
                           return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.HEISMAFIA.TITLE).setDescription(Messages.GAME.HEISMAFIA.DESCRIPTION).setColor(RED)] })
                        }
                     }
                  }
                 
                  for (var i = 0; i < Joined_Players.length; i++) {
                     if (Joined_Players[i] == user) {
                        for (var a = 0; a < Player_Roles.length; a++) {
                           
                           if (Player_Roles[a].Uid == user) {
                              switch (my_role) {
                                 case "경찰":
                                    Police_Select = user;
                                    Select_DONE++;
                                    Vote_Done_Players.push(message.author.id);
                                    for (var y = 0; y < Player_Roles.length; y++) {
                                       if (Police_Select == Player_Roles[y].Uid) {
                                          if (Player_Roles[y].Role != "마피아") {
                                             message.reply({
                                                embeds: [EMBED.setTitle(Messages.GAME.NOT_MAFIA.TITLE).
                                                   setDescription(`<@${Police_Select}>` + Messages.GAME.NOT_MAFIA.DESCRIPTION).setColor(RED)]
                                             })
                                             
                                          } else {
                                                message.reply({
                                                         embeds: [EMBED.setTitle(Messages.GAME.YES_MAFIA.TITLE).
                                                            setDescription(`<@${Police_Select}>` + Messages.GAME.YES_MAFIA.DESCRIPTION).setColor(GREEN)]
                                                         })

                                          }
                                       }
                                    }
                                    break;
                                 case "의사":
                                    Doctor_Select = user;
                                    Select_DONE++;
                                    Vote_Done_Players.push(message.author.id);
                                    break;
                                 case "마피아":
                                    console.log(Mafia_Select.every((e) => user !== e));
                                    if (Mafia_Select.every((e) => user !== e)) {
                                       Mafia_Select.push(user);
                                    Select_DONE++;
                                    Vote_Done_Players.push(message.author.id);
                                    }else{
                                       return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.SNRK_GOTDJ.TITLE).setDescription(Messages.GAME.SNRK_GOTDJ.DESCRIPTION).setColor(RED)] })
                                    }
                                    
                                    break;
                              }

                              if (Select_DONE == Player_Roles.length - Citizen_Count) {
                                 if (Player_Roles[j].Role != "경찰") message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_DONE_PLAYER_SELECT.TITLE).setDescription(`<@${user}>` + Messages.GAME.GAME_DONE_PLAYER_SELECT.DESCRIPTION).setColor(GREEN)] })
                                 for (var g = 0; g < Player_Roles.length; g++) {
                                    
                                    for (var b = 0; b < Mafia_Select.length; b++) {
                                       if (Mafia_Select[b] == Player_Roles[g].Uid) {
                                          if (Doctor_Select == Mafia_Select[b]) {
                                             Mafia_Select.splice(b, 1)
                                             await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.ALIVEUSER.TITLE).setDescription(Messages.GAME.ALIVEUSER.DESCRIPTION0 + `<@${Doctor_Select}>` + Messages.GAME.ALIVEUSER.DESCRIPTION1).setColor(GREEN)] })
                                             
                                          }
                                       }
                                    }
                                    for (var b = 0; b < Mafia_Select.length; b++) {
                                       if (Mafia_Select[b] == Player_Roles[g].Uid) {
                                          IsDie = true;
                                          if (Player_Roles[g].Role == "시민") Citizen_Count--;
                                          Lock_Channel(false, true, Player_Roles[g].Uid);
                                          await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.DIE_FROM_MAFIA.TITLE).setDescription(`<@${Mafia_Select[b]}>` + Messages.GAME.DIE_FROM_MAFIA.DESCRIPTION).setColor(RED)] })
                                          Player_Roles.splice(g, 1)
                                       }
                                    }
                                 }
                                 if (!IsDie) {
                                    await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.NO_DIE_FROM_MAFIA.TITLE).setDescription(Messages.GAME.NO_DIE_FROM_MAFIA.DESCRIPTION).setColor(RED)] })
                                    IsDie = false;
                                 }
                                 return Day_Talk(false)
                              } else {
                                 if (Player_Roles[j].Role != "경찰") return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_DONE_PLAYER_SELECT.TITLE).setDescription(`<@${user}>` + Messages.GAME.GAME_DONE_PLAYER_SELECT.DESCRIPTION).setColor(GREEN)] })
                                 return
                              }
                           }
                           
                           
                        }
                     }
                  
                  }
                  return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.NOT_FOUND_PLAYER.TITLE).setDescription(Messages.GAME.NOT_FOUND_PLAYER.DESCRIPTION).setColor(RED)] })
               })

            }
         }


         // 낮 투표
      } else if (message.channelId == game_channel_id) {
         if (message.author.bot) return
         var EMBED = new MessageEmbed();
         if (!IsVoteTime) return;
         if (Night) return
         if (!message.mentions.members.first()) return;
         if (message.mentions.members.first().id == message.author.id) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_ME_SELECT_ERROR.TITLE).setDescription(Messages.GAME.GAME_ME_SELECT_ERROR.DESCRIPTION).setColor(RED)] })
         for (var i = 0; i < Joined_Players.length; i++) {
            if (Joined_Players[i] == message.mentions.members.first().id) {
               for (var a = 0; a < Vote_Done_Players.length; a++) {
                  if (Vote_Done_Players[a] == message.author.id) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.ALREADY_VOTE.TITLE).setDescription(Messages.GAME.ALREADY_VOTE.DESCRIPTION).setColor(RED)] })
               }

               for (var a = 0; a < Vote_Player.length; a++) {
                  if (Vote_Player[a].Uid == message.mentions.members.first().id) {
                     Vote_Done_Players.push(message.author.id);
                     var BeforValue = Vote_Player[a].Vote
                     Select_DONE++;
                     Vote_Player[a] = ({ Uid: message.mentions.members.first().id, Vote: BeforValue + 1 })
                     break;
                  }
               }
               if (Select_DONE == Player_Roles.length) {
                  IsVoteTime = false;
                  await message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_DONE_PLAYER_SELECT.TITLE).setDescription(`<@${message.mentions.members.first().id}>` + Messages.GAME.GAME_DONE_PLAYER_SELECT.DESCRIPTION).setColor(GREEN)] })
                  Vote_Player.sort(function (a, b) {
                     return b.Vote - a.Vote
                  })
                  if (Vote_Player[0].Vote == Vote_Player[1].Vote) {
                     await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.VOTE_OVERLAP.TITLE).setDescription(Messages.GAME.VOTE_OVERLAP.DESCRIPTION).setColor(RED)] })
                     return Night_Select();
                  }
                  for (var j = 0; j < Player_Roles.length; j++) {
                     if (Player_Roles[j].Uid == Vote_Player[0].Uid) {

                        await Lock_Channel(true);
                        await Lock_Channel(false, false, Player_Roles[j].Uid)
                        await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.LAST_TALK.TITLE).setDescription(`<@${Player_Roles[j].Uid}>` + Messages.GAME.LAST_TALK.DESCRIPTION).setColor(GREEN)] })

                        setTimeout(async function (j, EMBED) {

                           if (Player_Roles[j].Role != "마피아") {
                              if (Player_Roles[j].Role == "시민") Citizen_Count--;
                              Lock_Channel(false, true, Player_Roles[j].Uid);
                              await (await (await client.guilds.cache.get(serverid)).channels.cache.get(game_channel_id)).send({ embeds: [EMBED.setTitle(Messages.GAME.NO_MAFIA.TITLE).setDescription(`<@${Player_Roles[j].Uid}>` + Messages.GAME.NO_MAFIA.DESCRIPTION).setColor(RED)] })
                              Player_Roles.splice(j, 1)
                              return Night_Select();
                           } else {
                              Lock_Channel(false, true, Player_Roles[j].Uid);
                              Mafia_Count--;
                              await (await (await client.guilds.cache.get(serverid)).channels.cache.get(game_channel_id)).send({ embeds: [EMBED.setTitle(Messages.GAME.MAFIA.TITLE).setDescription(`<@${Player_Roles[j].Uid}>` + Messages.GAME.MAFIA.DESCRIPTION + `${Mafia_Count}명`).setColor(GREEN)] })
                              Player_Roles.splice(j, 1)
                              return Night_Select();

                           }
                        }, 15000, j, EMBED)
                        return
                     }
                  }
               } else return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_DONE_PLAYER_SELECT.TITLE).setDescription(`<@${message.mentions.members.first().id}>` + Messages.GAME.GAME_DONE_PLAYER_SELECT.DESCRIPTION).setColor(GREEN)] })
            }

         }
         return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.NOT_FOUND_PLAYER.TITLE).setDescription(Messages.GAME.NOT_FOUND_PLAYER.DESCRIPTION).setColor(RED)] })


      }
   }
   if (message.channelId != game_channel_id) return
   if (!message.content.includes("!마피아")) return
   const args = message.content.slice(prefix.length).trim().split(/ +/);
   const command = args.shift();
   if (command == "마피아")
      if (cooldown.has(message.author.id)) {

         const timeLeft = cooldown.get(message.author.id) - Date.now();
         const converted = convertMS(timeLeft);
         if (converted.s <= 0) {
            cooldown.delete(message.author.id)
            command_start();
         }
      } else {
         cooldown.set(message.author.id, Date.now() + time);
         setTimeout(() => cooldown.delete(), time)
         command_start();
      }
   function command_start() {
      var EMBED = new MessageEmbed();
      if (!IsGamePlaying) {
         switch (args[0]) {
            case "시작":
               if (IsGameReady) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_READY_ERROR.TITLE).setDescription(Messages.GAME.GAME_READY_ERROR.DESCRIPTION).setColor(RED)], ephemeral: true });
               return Game_Ready(message)
            case "참가":
               if (!IsGameReady) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_NOT_READY.TITLE).setDescription(Messages.GAME.GAME_NOT_READY.DESCRIPTION).setColor(RED)], ephemeral: true })
               if (IsGamePlaying) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_PLAYING.TITLE).setDescription(Messages.GAME.GAME_PLAYING.DESCRIPTION).setColor(RED)], ephemeral: true });
               return Join_Player(message, false)
            case "나가기":
               if (IsGamePlaying) return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_PLAYING.TITLE).setDescription(Messages.GAME.GAME_PLAYING.DESCRIPTION).setColor(RED)], ephemeral: true });
               return Game_Leave(message)

            default:
               return message.reply({
                  embeds: [EMBED.setTitle(Messages.COMMAND_NOT_FOUND_ARGS.TITLE).setDescription(Messages.COMMAND_NOT_FOUND_ARGS.DESCRIPTION)
                     .setColor(RED)], ephemeral: true
               })
         }
      }
   }

   // 밤이 되었을 시 지목 대상을 가져오기 위함

})

client.login(token)




// 게임 함수

// 게임 입장 함수
/**
 * 
 * @param {Message} message 
 */
async function Join_Player(message, game_starter) {
   var EMBED = new MessageEmbed();
   if (!game_starter) {
      try {
         await message.author.send("마피아 게임에 참가 완료되었습니다")
      } catch (error) {
         console.log(error)
         return await message.reply({ embeds: [EMBED.setTitle(Messages.ERROR.DMOFF.TITLE).setDescription(Messages.ERROR.DMOFF.DESCRIPTION).setColor(RED)], element: true })
      }
   }
   for (var i = 0; i < Joined_Players.length; i++) {
      if (message.author.id == Joined_Players[i]) {
         return await message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_ALREADY_JOIN.TITLE).setDescription(Messages.GAME.GAME_ALREADY_JOIN.DESCRIPTION).setColor(RED)], ephemeral: true })
      }
   }
   Joined_Players.push(message.author.id)
   return await message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_JOIN.TITLE).setDescription(`<@${message.author.id}>${Messages.GAME.GAME_JOIN.DESCRIPTION}`).addField("참가자", SetDisplayUserText().toString()).setColor(BLUE)] })
}

// 게임 나가기 함수
/**
 * 
 * @param {Message} message 
 */
async function Game_Leave(message) {
   var EMBED = new MessageEmbed();

   for (var i = 0; i < Joined_Players.length; i++) {
      if (message.author.id == Joined_Players[i]) {
         if (Joined_Players.length == 1) {
            clearTimeout(Timer)
            await message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_LEAVE.TITLE).setDescription(`<@${message.author.id}>${Messages.GAME.GAME_LEAVE.DESCRIPTION}`).setColor(BLUE)] })
            return Game_End();
         } else {
            Joined_Players.splice(i, 1)
            EMBED.addField("참가자", SetDisplayUserText().toString())
            return await message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_LEAVE.TITLE).setDescription(`<@${message.author.id}>${Messages.GAME.GAME_LEAVE.DESCRIPTION}`).setColor(BLUE)] })
         }
      }
   };
   return message.reply({ embeds: [EMBED.setTitle(Messages.GAME.GAME_NOT_JOIN_LEAVE.TITLE).setDescription(Messages.GAME.GAME_NOT_JOIN_LEAVE.DESCRIPTION).setColor(RED)], ephemeral: true })

}

// 게임 준비 함수
/**
 * 
 * @param {Message} message 
 */
async function Game_Ready(message) {
   console.log("게임이 준비됨")
   var EMBED = new MessageEmbed();
   try {
      await message.author.send("마피아 게임에 참가 완료되었습니다")
   } catch (error) {
      return message.reply({ embeds: [EMBED.setTitle(Messages.ERROR.DMOFF.TITLE).setDescription(Messages.ERROR.DMOFF.DESCRIPTION).setColor(RED)], ephemeral: true })
   }

   Game_Reset();
   IsGameReady = true;



   Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_READY.TITLE).setDescription(Messages.GAME.GAME_READY.DESCRIPTION).setColor(BLUE)] })
   Join_Player(message, true)

   Timer = setTimeout(function () {
      EMBED = new MessageEmbed();
      if (IsGameReady) {
         if (Joined_Players.length <= 3) {
            Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_PLAYERS_COUNT_ERROR.TITLE).setDescription(Messages.GAME.GAME_PLAYERS_COUNT_ERROR.DESCRIPTION).setColor(RED)] })
            return Game_End()
         }
         Game_Start()
      }
   }, 30000); // 30초로 변경하기
}

// 게임 시작 함수
async function Game_Start() {
   // 게임 시작 전 기초설정
   var EMBED = new MessageEmbed();
   IsGameReady = false;
   IsGamePlaying = true;
   Night = false;
   await Lock_Channel(true, false);
   await Lock_Channel(false, true)

   // 게임 시작 전 안내 메시지 전송
   await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_START.TITLE).setDescription(Messages.GAME.GAME_START.DESCRIPTION).setColor(BLUE)] });
   var EMBED = new MessageEmbed();
   await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_SET_ROLE.TITLE).setDescription(Messages.GAME.GAME_SET_ROLE.DESCRIPTION).setColor(BLUE)] });

   // 인원수에 따라 마피아 수가 다르게 적용되도록 만드는 조건문
   if (Joined_Players.length > 3) {
      if (Joined_Players.length >= 6) {
         if (Joined_Players.length >= 8) {
            await overlap(5);
            await push_role(Joined_Players[Suser[0]], "경찰")
            await push_role(Joined_Players[Suser[1]], "의사")
            await push_role(Joined_Players[Suser[2]], "마피아")
            await push_role(Joined_Players[Suser[2]], "마피아")
            await push_role(Joined_Players[Suser[2]], "마피아")

            Mafia_Count = 3;
         } else {
            Mafia_Count = 2;
            await overlap(4);
            await push_role(Joined_Players[Suser[0]], "경찰")
            await push_role(Joined_Players[Suser[1]], "의사")
            await push_role(Joined_Players[Suser[2]], "마피아")
            await push_role(Joined_Players[Suser[3]], "마피아")
         }
      } else {
         Mafia_Count = 1;
         await overlap(3);
         await push_role(Joined_Players[Suser[0]], "경찰")
         await push_role(Joined_Players[Suser[1]], "의사")
         await push_role(Joined_Players[Suser[2]], "마피아")
      }

   }

   // 반복문을 통해 직업이 없는 플레이어일 경우 시민으로 지정하는 반복 및 조건문
   Loop1: for (var i = 0; i < Joined_Players.length; i++) {
      for (var j = 0; j < Player_Roles.length; j++) {
         if (Player_Roles[j].Uid == Joined_Players[i]) continue Loop1;
      }
      Citizen_Count++;
      await push_role(Joined_Players[i], "시민")
   }
   var mafia_user = "";
   for (var i = 0; i < Player_Roles.length; i++) {
      if (Player_Roles[i].Role == "마피아" && Mafia_Count > 1) {
         mafia_user = mafia_user + `<@${Player_Roles[i].Uid}>\n`
      }
   }
   if (Mafia_Count == 1) {
      mafia_user = "당신 외 없음"
   }
   Player_Roles.forEach(async (mafia) => {
      if (mafia.Role == "마피아") {
         await client.users.fetch(mafia.Uid).then(async (user) => {
            await user.send({ embeds: [EMBED.setTitle("안내").setDescription(`당신을 포함한 마피아는\n${mafia_user}`)] })
         })
      }
   })

   // 역할 설정 완료 메시지 출력
   var EMBED = new MessageEmbed();
   await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_DONE_SET_ROLE.TITLE).setDescription(Messages.GAME.GAME_DONE_SET_ROLE.DESCRIPTION).setColor(GREEN)] })

   Day_Talk(true);
}

async function Day_Talk(IsFirstNight) {
   Night = false;
   Select_DONE = 0;
   IsVoteTime = false;
   await Lock_Channel(true);
   await Lock_Channel(false, true)
   var EMBED = new MessageEmbed();
   if (Mafia_Count == Player_Roles.length - Mafia_Count) {
      Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_END_MAFIA_WON.TITLE).setDescription(Messages.GAME.GAME_END_MAFIA_WON.DESCRIPTION).setColor(RED)] })
      return Game_Reset()
   } else if (Mafia_Count == 0) {
      Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_END_MAFIA_LOSE.TITLE).setDescription(Messages.GAME.GAME_END_MAFIA_LOSE.DESCRIPTION).setColor(GREEN)] })
      return Game_Reset()
   }
   await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_TALK_TIME.TITLE).setDescription(Messages.GAME.GAME_TALK_TIME.DESCRIPTION).setColor(BLUE)] });
   clearTimeout(Timer)
   Timer = setTimeout(async function () {
      if (IsFirstNight) {
         Night_Select()
      } else {
         IsVoteTime = true;
         Vote_Player = [];
         Vote_Done_Players = [];
         for (var a = 0; a < Joined_Players.length; a++) {
            Vote_Player.push({ Uid: Joined_Players[a], Vote: 0 });
         }
         await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.VOTE_TIME.TITLE).setDescription(Messages.GAME.VOTE_TIME.DESCRIPTION).setColor(BLUE)] });


      }
   }, 120000); // 4분으로 수정후 메시지도 4분으로 수정
}
async function Night_Select() {
   var EMBED = new MessageEmbed();
   if (Mafia_Count == Player_Roles.length - Mafia_Count) {
      Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_END_MAFIA_WON.TITLE).setDescription(Messages.GAME.GAME_END_MAFIA_WON.DESCRIPTION).setColor(RED)] })
      return Game_Reset()
   } else if (Mafia_Count == 0) {
      Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_END_MAFIA_LOSE.TITLE).setDescription(Messages.GAME.GAME_END_MAFIA_LOSE.DESCRIPTION).setColor(GREEN)] })
      return Game_Reset()
   }

   await Lock_Channel(true, false)
   Vote_Done_Players = [];
   Police_Select = null;
   Doctor_Select = null;
   Select_DONE = 0;
   Mafia_Select = [];
   Night = true;
   Select_DONE = 0;
   IsVoteTime = true;
   await Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_NIGHT.TITLE).setDescription(Messages.GAME.GAME_NIGHT.DESCRIPTION).setColor(BLUE)] })
}



// 랜덤 역할 설정 시 중복되는 항목이 없도록 랜덤으로 역할을 설정하는 함수
async function overlap(i) {
   Suser = [];
   var ia = 0;
   do {
      let k = Math.floor(Math.random() * (Joined_Players.length - 1));
      if (Suser.every((e) => k !== e)) {
         Suser.push(k);
         ia++
      }
   } while (ia < i)
}

// 배열에 각 직업과 유저 아이디를 저장하는 함수
async function push_role(Uid, Role) {
   var EMBED = new MessageEmbed();
   Player_Roles.push({ Uid: Uid, Role: Role })
   const user = await client.users.fetch(Uid);
   return user.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_ROLE_SEND.TITLE).setDescription(Messages.GAME.GAME_ROLE_SEND.DESCRIPTION0 + Role + Messages.GAME.GAME_ROLE_SEND.DESCRIPTION1).setColor(BLUE)] })
}

// 게임 종료 함수
async function Game_End() {
   var EMBED = new MessageEmbed();
   Channel.send({ embeds: [EMBED.setTitle(Messages.GAME.GAME_END_MESSAGE.TITLE).setDescription(Messages.GAME.GAME_END_MESSAGE.DESCRIPTION).setColor(BLUE)] })
   Game_Reset();
}

// 임베드에 보여질 텍스트를 배열에서 가져와서 텍스트로 변환 후 정리하는 함수
function SetDisplayUserText() {
   DisplayUserText = "";
   Joined_Players.forEach(value => {
      DisplayUserText = DisplayUserText + `<@${value}>\n`;
   });
   return DisplayUserText;
}

// 채널을 락시키는 함수
async function Lock_Channel(isLock, isPlayer, uid) {
   if (isLock) {

      await Channel.permissionOverwrites.set([{
         id: client.guilds.cache.get(serverid).roles.everyone.id,
         deny: ['SEND_MESSAGES'],
      }])
      await Channel.permissionOverwrites.edit(client.user.id, { SEND_MESSAGES: true })
   } else {
      if (isPlayer) {
         if (!uid) {
            await Channel.permissionOverwrites.edit(client.user.id, { SEND_MESSAGES: true })
            Player_Roles.forEach(async player => {
               await Channel.permissionOverwrites.edit(client.guilds.cache.get(serverid).members.cache.get(player.Uid), { SEND_MESSAGES: true })
            });
         } else {
            await Channel.permissionOverwrites.edit(client.guilds.cache.get(serverid).members.cache.get(uid), {
               SEND_MESSAGES: false
            })
         }
      } else {
         if (!uid) {
            await Channel.permissionOverwrites.set([{
               id: client.guilds.cache.get(serverid).roles.everyone.id,
               allow: ['SEND_MESSAGES']
            }])
         } else {
            await Channel.permissionOverwrites.edit(client.guilds.cache.get(serverid).members.cache.get(uid), {
               SEND_MESSAGES: true
            })
         }
      }
   }

}

// 게임 변수를 초기화시키는 함수
function Game_Reset() {
   IsGameReady = false;
   IsGamePlaying = false;
   Joined_Players = [];
   Player_Roles = [];
   Night = false;
   DisplayUserText = "";
   Timer;
   Select_DONE = 0;
   Citizen_Count = 0
   Mafia_Count = 0;
   IsVoteTime = false;
   Vote_Player = [];
   Suser = [];
   Police_Select = null;
   Doctor_Select = null;
   Mafia_Select = [];
   IsDie = false;
   Lock_Channel(false, false);
}
