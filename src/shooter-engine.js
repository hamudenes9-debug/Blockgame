export const WIDTH=400, HEIGHT=520;
export function createShooter(stage=1){stage=Math.max(1,Math.floor(Number(stage)||1));return {stage,x:200,blocks:[],bullets:[],effects:[],enemyShots:[],boss:null,bossSpawned:false,won:false,score:0,kills:0,lives:3,time:0,spawn:0,cooldown:0,over:false};}
export function stepShooter(s,dt,firing,random=Math.random){
 if(s.over)return;
 dt=Math.max(0,Math.min(dt,.05));s.time+=dt;s.cooldown-=dt;s.spawn-=dt;
 const level=s.stage;
 if(firing&&s.cooldown<=0){s.bullets.push({x:s.x,y:HEIGHT-51});s.cooldown=.16;}
 if(s.kills>=12&&!s.bossSpawned){s.bossSpawned=true;s.blocks=[];const hp=25+level*5;s.boss={x:200,y:80,hp,maxHp:hp,size:90,shot:1};}
 if(!s.bossSpawned&&s.spawn<=0){const hp=1+Math.floor(random()*Math.min(4,level));s.blocks.push({x:24+random()*(WIDTH-48),y:-26,size:32+random()*12,hp,maxHp:hp,color:Math.floor(random()*5)});s.spawn=Math.max(.36,1.05-level*.04);}
 for(const b of s.blocks)b.y+=Math.min(110,28+level*6)*dt;
 if(s.boss){const b=s.boss;b.x=200+Math.sin(s.time*1.2)*130;b.shot-=dt;if(b.shot<=0){const dx=s.x-b.x,dy=HEIGHT-32-b.y,length=Math.hypot(dx,dy),speed=Math.min(220,115+level*7);s.enemyShots.push({x:b.x,y:b.y+40,vx:dx/length*speed,vy:dy/length*speed});b.shot=Math.max(.45,1.3-level*.04);}}
 for(const bullet of s.bullets){const previous=bullet.y;bullet.y-=550*dt;const targets=s.boss?[s.boss]:s.blocks;for(const block of targets){if(block.hp>0&&Math.abs(bullet.x-block.x)<=block.size/2+3&&bullet.y<=block.y+block.size/2&&previous>=block.y-block.size/2){block.hp--;bullet.dead=true;if(block.hp===0){if(block===s.boss){s.score+=1000*level;s.won=true;s.over=true;s.effects.push({x:block.x,y:block.y,life:.45,color:1});}else{s.kills++;s.score+=block.maxHp*50;s.effects.push({x:block.x,y:block.y,life:.45,color:block.color});}}break;}}}
 s.bullets=s.bullets.filter(b=>!b.dead&&b.y>-10);
 s.blocks=s.blocks.filter(b=>{if(b.hp<=0)return false;if(b.y+b.size/2>=HEIGHT-48){s.lives--;return false;}return true;});
 for(const shot of s.enemyShots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;if(!s.won&&Math.abs(shot.x-s.x)<25&&Math.abs(shot.y-(HEIGHT-27))<20){s.lives--;shot.dead=true;}}
 s.enemyShots=s.enemyShots.filter(b=>!b.dead&&b.y<HEIGHT+15&&b.x>-15&&b.x<WIDTH+15);
 s.effects.forEach(e=>e.life-=dt);s.effects=s.effects.filter(e=>e.life>0);
 if(s.lives<=0&&!s.won){s.lives=0;s.over=true;}
}
