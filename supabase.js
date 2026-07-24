/**
 * Supabase Bağlantısı ve Veri İşlemleri
 * Kendi Supabase projenizi oluşturduğunuzda URL ve KEY alanlarını güncelleyin.
 */

const SUPABASE_URL = 'https://znzktpbgngksgastbeev.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_avOlt4hF0mnXeEBFIpMdng_YKj2jloU';

// Supabase Client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.db = {
    auth: {
        async login(email, password) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },
        async logout() {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
        },
        async getSession() {
            const { data, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            return data.session;
        }
    },
    money: {
        async getAll() {
            const { data, error } = await window.supabaseClient.from('money_records').select('*').order('date', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        async create(record) {
            const { data, error } = await window.supabaseClient.from('money_records').insert([record]).select();
            if (error) throw error;
            return data;
        },
        async updateStatus(id, status) {
            const { data, error } = await window.supabaseClient.from('money_records').update({ status }).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        async delete(id) {
            const { data, error } = await window.supabaseClient.from('money_records').delete().eq('id', id);
            if (error) throw error;
            return data;
        }
    },
    planner: {
        async getAll() {
            const { data, error } = await window.supabaseClient.from('planner_records').select('*').order('date', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        async create(record) {
            const { data, error } = await window.supabaseClient.from('planner_records').insert([record]).select();
            if (error) throw error;
            return data;
        },
        async updateStatus(id, status) {
            const { data, error } = await window.supabaseClient.from('planner_records').update({ status }).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        async delete(id) {
            const { data, error } = await window.supabaseClient.from('planner_records').delete().eq('id', id);
            if (error) throw error;
            return data;
        }
    }
};