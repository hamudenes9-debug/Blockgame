export const WIDTH=400, HEIGHT=520;
export function createShooter(){return {x:200,blocks:[],bullets:[],effects:[],score:0,kills:0,lives:3,time:0,spawn:0,cooldown:0,over:false};}
export function stepShooter(s,dt,firing,random=Math.random){
 if(s.over)return;
 dt=Math.max(0,Math.min(dt,.05));s.time+=dt;s.cooldown-=dt;s.spawn-=dt;
 const level=1+Math.floor(s.kills/12);
 if(firing&&s.cooldown<=0){s.bullets.push({x:s.x,y:HEIGHT-51});s.cooldown=.16;}
 if(s.spawn<=0){const hp=1+Math.floor(random()*Math.min(4,level));s.blocks.push({x:24+random()*(WIDTH-48),y:-26,size:32+random()*12,hp,maxHp:hp,color:Math.floor(random()*5)});s.spawn=Math.max(.32,1.05-level*.055);}
 for(const b of s.blocks)b.y+=(28+level*6)*dt;
 for(const bullet of s.bullets){const previous=bullet.y;bullet.y-=550*dt;for(const block of s.blocks){if(block.hp>0&&Math.abs(bullet.x-block.x)<=block.size/2+3&&bullet.y<=block.y+block.size/2&&previous>=block.y-block.size/2){block.hp--;bullet.dead=true;if(block.hp===0){s.kills++;s.score+=block.maxHp*50;s.effects.push({x:block.x,y:block.y,life:.45,color:block.color});}break;}}}
 s.bullets=s.bullets.filter(b=>!b.dead&&b.y>-10);
 s.blocks=s.blocks.filter(b=>{if(b.hp<=0)return false;if(b.y+b.size/2>=HEIGHT-48){s.lives--;return false;}return true;});
 s.effects.forEach(e=>e.life-=dt);s.effects=s.effects.filter(e=>e.life>0);
 if(s.lives<=0){s.lives=0;s.over=true;}
}
