const fs = require('fs');

let content = fs.readFileSync('page.tsx', 'utf-8');

// 1. Modals styling (make forms larger)
content = content.replace(/className="max-w-md w-full"/g, 'className="max-w-2xl w-full"');
content = content.replace(/px-4 py-3 text-white text-xs/g, 'px-5 py-4 text-white text-sm');
content = content.replace(/text-\[10px\] font-black text-neutral-400 block mb-1\.5/g, 'text-xs font-black text-neutral-400 block mb-2');
content = content.replace(/text-lg font-black text-white uppercase tracking-tight/g, 'text-2xl font-black text-white uppercase tracking-tight');
content = content.replace(/px-6 py-3 bg-gradient/g, 'px-8 py-4 text-sm bg-gradient');
content = content.replace(/px-5 py-3 border border-white\/10/g, 'px-6 py-4 text-sm border border-white/10');
content = content.replace(/text-xs font-extrabold uppercase rounded-xl/g, 'font-extrabold uppercase rounded-xl');

// 2. Adjusting tiny text classes across tabs
content = content.replace(/text-xs text-\[#A1A1AA\] mt-1/g, 'text-sm text-[#A1A1AA] mt-2');
content = content.replace(/text-xs text-\[#A1A1AA\] mb-5/g, 'text-sm text-[#A1A1AA] mb-6');

// Appointments list
content = content.replace(/text-xs text-\[#A1A1AA\] space-y-1/g, 'text-sm text-[#A1A1AA] space-y-2');
content = content.replace(/text-xs text-neutral-300 mt-2\.5/g, 'text-sm text-neutral-300 mt-3');
content = content.replace(/text-\[10px\] text-neutral-500 font-bold uppercase/g, 'text-xs text-neutral-500 font-bold uppercase');
content = content.replace(/text-xs bg-\[#D61F2C\]\/5/g, 'text-sm bg-[#D61F2C]/5');
content = content.replace(/text-\[10px\] font-bold uppercase tracking-wider block mb-0\.5/g, 'text-xs font-bold uppercase tracking-wider block mb-1');
content = content.replace(/text-\[9px\] font-mono font-black uppercase/g, 'text-[11px] font-mono font-black uppercase');

// Part requests list
content = content.replace(/text-\[10px\] text-neutral-500 font-mono mt-0\.5/g, 'text-xs text-neutral-500 font-mono mt-1');
content = content.replace(/text-xs text-neutral-300 bg-black\/40 p-3/g, 'text-sm text-neutral-300 bg-black/40 p-4');
content = content.replace(/text-\[9px\] font-bold text-neutral-500/g, 'text-xs font-bold text-neutral-500');

// Reviews list sizing
content = content.replace(/text-xs text-neutral-200 leading-relaxed italic mb-4/g, 'text-base text-neutral-200 leading-relaxed italic mb-5');
content = content.replace(/w-6 h-6 rounded-full/g, 'w-8 h-8 rounded-full text-sm');

// History Tab sizing
content = content.replace(/text-\[10px\] text-neutral-500 mt-1 font-mono/g, 'text-xs text-neutral-500 mt-1 font-mono');
content = content.replace(/text-\[9px\] text-\[#A1A1AA\] font-bold uppercase/g, 'text-xs text-[#A1A1AA] font-bold uppercase');
content = content.replace(/text-\[9px\] font-black text-neutral-500/g, 'text-xs font-black text-neutral-500');
content = content.replace(/text-xs bg-black\/40 px-3 py-2\.5/g, 'text-sm bg-black/40 px-4 py-3');
content = content.replace(/text-\[10px\] text-neutral-500 mt-0\.5/g, 'text-xs text-neutral-500 mt-1');
content = content.replace(/text-\[10px\] text-\[#A1A1AA\] bg-white\/\[0\.02\]/g, 'text-xs text-[#A1A1AA] bg-white/[0.02]');


// 3. Tabular replacement for vehicles map
const oldVehiclesCode = `<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {vehicles.map(v => (
                        <div 
                          key={v.id} 
                          className="bg-[#121214]/80 border border-white/5 hover:border-[#D61F2C]/30 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                        >
                          {/* Sleek SVG Car Outline Watermark */}
                          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:opacity-10 group-hover:text-[#D61F2C] text-white transition-all duration-500 pointer-events-none">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                              <circle cx="7" cy="17" r="2"></circle>
                              <circle cx="17" cy="17" r="2"></circle>
                            </svg>
                          </div>

                          <div>
                                             {v.notes && (
                              <div className="text-xs text-neutral-400 bg-black/40 p-3 rounded-lg border border-white/[0.02] italic mb-4">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block not-italic mb-1">Specifications & Notes:</span>
                                "{v.notes}"
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.03]">
                            <button 
                              onClick={() => openVehicleModal(v)}
                              className="p-2 text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-all"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteVehicle(v.id)}
                              className="p-2 text-red-500 hover:text-white bg-red-500/[0.02] hover:bg-red-600 border border-transparent rounded-lg transition-all"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>`;

const newVehiclesCode = `<div className="overflow-x-auto rounded-xl border border-white/5 shadow-lg bg-[#121214]/80">
                      <table className="w-full text-left text-sm text-neutral-300">
                        <thead className="bg-[#1a1c23] text-xs uppercase text-neutral-400 font-black border-b border-white/[0.05]">
                          <tr>
                            <th className="px-6 py-4">Vehicle Number</th>
                            <th className="px-6 py-4">Make & Model</th>
                            <th className="px-6 py-4">Year/Color</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicles.map(v => (
                            <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 font-bold text-white font-mono whitespace-nowrap">{v.vehicleNumber}</td>
                              <td className="px-6 py-4 font-semibold text-neutral-200 whitespace-nowrap">{v.make} <span className="text-neutral-500">{v.model}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap">{v.year || '-'} {v.color ? \`· \${v.color}\` : ''}</td>
                              <td className="px-6 py-4 text-xs italic text-neutral-400 max-w-[200px] truncate" title={v.notes || ''}>{v.notes || '-'}</td>
                              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                <button onClick={() => openVehicleModal(v)} className="p-2 text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-all" title="Edit Vehicle"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteVehicle(v.id)} className="p-2 text-red-500 hover:text-white bg-red-500/[0.02] hover:bg-red-600 border border-transparent rounded-lg transition-all" title="Delete Vehicle"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>`;

content = content.replace(oldVehiclesCode, newVehiclesCode);

fs.writeFileSync('page.tsx', content);
console.log('Done replacement.');
