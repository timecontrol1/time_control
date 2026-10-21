async function borrarTurnoUnico(idTurno) {
  if (!confirm("¿Eliminar este registro de turno?")) return;

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("registros_turnos")
      .delete()
      .eq("id", idTurno)
      .select("id");

    if (error) throw error;

    if (!data || data.length !== 1) {
      throw new Error(
        "Supabase no confirmó la eliminación. " +
        "Revisa los permisos del administrador."
      );
    }

    await syncDataFromSupabase();
    alert("Registro eliminado y confirmado en Supabase.");
  } catch (e) {
    alert("No se pudo eliminar: " + e.message);
  }
}
