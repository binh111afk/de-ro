const M={H:1,C:12,N:14,O:16,Na:23,Mg:24,Al:27,S:32,Cl:35.5,K:39,Ca:40,Fe:56,Cu:64,Zn:65,Ag:108};
const mol=(f)=>{let t=0;for(const [,el,n] of f.matchAll(/([A-Z][a-z]?)(\d*)/g)){t+=M[el]*(n?+n:1)}return t};
const r=(x,d=2)=>Math.round(x*10**d)/10**d;
const out={};
out.saccarozo=mol("C12H22O11");                       // N1
out.tinhbot_unit=mol("C6H10O5");                      // T8
const glu=48.6/162*0.8; out.T8_Ag_g=r(glu*2*108);     // expect 51.84
out.T9_CaCO3_g=r((0.2-(0.3-0.2))*100);                // expect 10
out.ester_C4H8O2=mol("C4H8O2");
out.T11_salt_g=r(Math.min(17.6/mol("C4H8O2"),0.2)*0+0.15*mol("CH3COONa"));  // NaOH 0,15 mol limiting -> 12.3
out.T12_OH_035_n=r(0.1-(0.35-0.3));                   // 0.05 -> 3.9 g
out.T12_m_g=r(0.05*mol("Al(OH)3"));
out.S2_H2_L={Mg:0.1*22.4,Al:0.15*22.4,Zn:0.1*22.4,Fe:0.1*22.4,MgFe:0.2*22.4};
out.S3_gly_M=mol("C2H5NO2"); out.S3_CO2_mol=r(7.5/out.S3_gly_M*2,3);
out.S1_triolein=mol("C57H104O6");
const Q=1.93*1000, ne=Q/96500; out.S4_ne=r(ne,4);
out.S4_Cu_1000s_g=r(ne/2*64); out.S4_Cl2_1000s_L=r(ne/2*22.4,3);
out.S4_2000s_Cl2_L=r(2*ne/2*22.4,3); out.S4_Cu2plus_mol=0.1*0.2;
out.S6_ala_M=mol("C3H7NO2"); out.S6_dipep_mol=r(17.8/out.S6_ala_M/2,3);
out.S7_PVC_unit=mol("C2H3Cl"); out.S7_n=r(625000/out.S7_PVC_unit,0);
out.S8_KMnO4_mol=r(11.2/56/5,4);
out.N2_note="C3H9N primary amines: 2 (propan-1-amine, propan-2-amine)";
out.N3_salt_g=r(8.8/mol("C4H8O2")*mol("CH3COONa"));
out.N4_tristearin=mol("C57H110O6"); const ts=44.5/out.N4_tristearin;
out.N4_soap_g=r(ts*3*mol("C17H35COONa")*0.9,2);       // expect 41,31 -> 41,3
out.N5_Al_g=r(9.65*2000/96500/3*0.8*27,3);            // expect 1.44
// N6: x Mg, y Al: 24x+27y=7.8 ; x+1.5y=0.4
const y=(7.8-24*0.4)/(27-36); const x=0.4-1.5*y; out.N6={x,y,pctMg:r(x*24/7.8*100,2)}; // 30.77 -> 30,8
out.N7_C3H9N=mol("C3H9N"); out.N7_H2O_g=r(5.9/out.N7_C3H9N*4.5*18);  // 8.1
out.N8_NO2_L=r(6.4/64*2*22.4);                        // 4.48
out.N9_glucose_g=r((40/100/0.8)/2*180);               // CO2 0.4 -> glu 0.2 -> /0.8=0.25 -> 45
out.N10_Ag_g=r(6.5/65*2*108);                         // 21.6
out.N1_check=mol("C12H22O11");
console.log(JSON.stringify(out,null,1));
