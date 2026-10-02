import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalDinamizador } from "./ModalDinamizador";
import { RosterTable } from "./RosterTable";
import { FilaProvincia } from "@/components/FilaProvincia";
import { agruparPorProvincia } from "@/lib/provincias";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  buildEncuentroViewRows,
  getCatalogoInfoplazas,
  getDinamizadores,
} from "../services/dinamizadoresService";
import type {
  Dinamizador,
  EncuentroViewRow,
  InfoplazaCatalogo,
} from "../services/dinamizadoresService";
type FilaConDinamizador = EncuentroViewRow & { dinamizador: Dinamizador };
const tieneDinamizador = (fila: EncuentroViewRow): fila is FilaConDinamizador =>
  fila.dinamizador !== null;
export function DinamizadoresRoster() {
  const [dinamizadores, setDinamizadores] = useState<Dinamizador[]>([]);
  const [infoplazas, setInfoplazas] = useState<InfoplazaCatalogo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [dinamizadorSeleccionado, setDinamizadorSeleccionado] =
    useState<Dinamizador | null>(null);
  const [infoplazaPreseleccionada, setInfoplazaPreseleccionada] = useState<
    string | null
  >(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [listaDinamizadores, catalogoInfoplazas] = await Promise.all([
        getDinamizadores(),
        getCatalogoInfoplazas(),
      ]);
      setDinamizadores(listaDinamizadores);
      setInfoplazas(catalogoInfoplazas);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los dinamizadores.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const infoplazasActivas = useMemo(
    () => infoplazas.filter((infoplaza) => !infoplaza.cerrada),
    [infoplazas],
  );
  const filasEncuentros = useMemo(
    () => buildEncuentroViewRows(infoplazasActivas, dinamizadores),
    [dinamizadores, infoplazasActivas],
  );
  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    if (!termino) return filasEncuentros;
    return filasEncuentros.filter(
      ({ infoplaza, dinamizador }) =>
        infoplaza.nombre.toLocaleLowerCase().includes(termino) ||
        infoplaza.codigo.toLocaleLowerCase().includes(termino) ||
        dinamizador?.nombre.toLocaleLowerCase().includes(termino) ||
        dinamizador?.cedula?.toLocaleLowerCase().includes(termino),
    );
  }, [busqueda, filasEncuentros]);
  const filasAsignadas = useMemo(
    () => filasFiltradas.filter(tieneDinamizador),
    [filasFiltradas],
  );
  const filasSinAsignar = useMemo(
    () => filasFiltradas.filter((fila) => !tieneDinamizador(fila)),
    [filasFiltradas],
  );

  const gruposAsignados = useMemo(
    () => agruparPorProvincia(filasAsignadas, (fila) => fila.infoplaza.region),
    [filasAsignadas],
  );
  const gruposSinAsignar = useMemo(
    () => agruparPorProvincia(filasSinAsignar, (fila) => fila.infoplaza.region),
    [filasSinAsignar],
  );

  const abrirCreacion = (codigoInfoplaza: string | null = null) => {
    setDinamizadorSeleccionado(null);
    setInfoplazaPreseleccionada(codigoInfoplaza);
    setModalAbierto(true);
  };
  const abrirEdicion = (dinamizador: Dinamizador) => {
    setInfoplazaPreseleccionada(null);
    setDinamizadorSeleccionado(dinamizador);
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setDinamizadorSeleccionado(null);
    setInfoplazaPreseleccionada(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Dinamizadores
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Administrá los datos de contacto de los dinamizadores.
          </p>
        </div>
        <Button
          onClick={() => abrirCreacion()}
          disabled={cargando || Boolean(error)}
        >
          <Plus />
          Agregar dinamizador
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre, cédula o código"
          className="pl-9"
          aria-label="Buscar dinamizadores"
          disabled={cargando || Boolean(error)}
        />
      </div>
      {cargando ? (
        <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Cargando dinamizadores...
        </p>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive" role="alert">
            No se pudieron cargar los datos: {error}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => void cargarDatos()}
          >
            Reintentar
          </Button>
        </div>
      ) : infoplazasActivas.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No hay infoplazas disponibles en el catálogo.
        </p>
      ) : (
        <div className="space-y-6">
          <RosterTable
            titulo="Con dinamizador asignado"
            descripcion={`Mostrando ${filasAsignadas.length} dinamizadores`}
            columnas={[
              "Infoplaza",
              "Dinamizador",
              "Cédula",
              "Celular",
              "Estatus",
            ]}
            vacio="No hay dinamizadores asignados que coincidan con la búsqueda."
            sinFilas={filasAsignadas.length === 0}
          >
            {gruposAsignados.map(({ provincia, elementos }) => [
              <FilaProvincia
                key={`provincia-${provincia}`}
                provincia={provincia}
                cantidad={elementos.length}
                columnas={6}
              />,
              ...elementos.map(({ infoplaza, dinamizador }) => (
                <TableRow key={infoplaza.codigo}>
                  <TableCell className="font-medium">
                    {infoplaza.nombre}
                  </TableCell>
                  <TableCell>{dinamizador.nombre}</TableCell>
                  <TableCell>{dinamizador.cedula || "—"}</TableCell>
                  <TableCell>{dinamizador.celular || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        dinamizador.estatus === "Activo"
                          ? "font-medium text-emerald-700"
                          : "font-medium text-slate-500"
                      }
                    >
                      {dinamizador.estatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirEdicion(dinamizador)}
                    >
                      <Pencil />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              )),
            ])}
          </RosterTable>
          <RosterTable
            titulo="Sin dinamizador asignado"
            descripcion={`Mostrando ${filasSinAsignar.length} infoplazas`}
            columnas={["Infoplaza", "Estatus"]}
            vacio="No hay infoplazas sin dinamizador que coincidan con la búsqueda."
            sinFilas={filasSinAsignar.length === 0}
          >
            {gruposSinAsignar.map(({ provincia, elementos }) => [
              <FilaProvincia
                key={`provincia-${provincia}`}
                provincia={provincia}
                cantidad={elementos.length}
                columnas={3}
              />,
              ...elementos.map(({ infoplaza }) => (
                <TableRow key={infoplaza.codigo}>
                  <TableCell className="font-medium">
                    {infoplaza.nombre}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-amber-700">
                      Sin dinamizador asignado
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirCreacion(infoplaza.codigo)}
                    >
                      Asignar dinamizador
                    </Button>
                  </TableCell>
                </TableRow>
              )),
            ])}
          </RosterTable>
        </div>
      )}
      <ModalDinamizador
        abierto={modalAbierto}
        dinamizador={dinamizadorSeleccionado}
        infoplazaPreseleccionada={infoplazaPreseleccionada}
        infoplazas={infoplazasActivas}
        onCerrar={cerrarModal}
        onGuardado={cargarDatos}
      />
    </section>
  );
}
